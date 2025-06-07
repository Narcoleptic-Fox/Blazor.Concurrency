using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Blazor.Concurrency.Workers;

/// <summary>
/// Core worker orchestration service - completely agnostic to consumers
/// </summary>
public class WorkerOrchestrationService : IWorkerExecutor, IAsyncDisposable
{
    private readonly IJSRuntime _jsRuntime;
    private readonly ILogger<WorkerOrchestrationService> _logger;
    private readonly ConcurrentDictionary<string, WorkerOperationContext> _activeOperations;
    private readonly SemaphoreSlim _initializationLock;
    private bool _isInitialized;
    private DotNetObjectReference<WorkerOrchestrationService>? _dotNetReference;

    public WorkerOrchestrationService(IJSRuntime jsRuntime, ILogger<WorkerOrchestrationService> logger)
    {
        _jsRuntime = jsRuntime;
        _logger = logger;
        _activeOperations = new ConcurrentDictionary<string, WorkerOperationContext>();
        _initializationLock = new SemaphoreSlim(1, 1);
    }

    public async Task InitializeAsync()
    {
        await _initializationLock.WaitAsync();
        try
        {
            if (_isInitialized) return;

            _dotNetReference = DotNetObjectReference.Create(this);

            await _jsRuntime.InvokeVoidAsync("BlazorConcurrency.initialize", _dotNetReference);

            _isInitialized = true;
            _logger.LogInformation("Worker orchestration system initialized");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize worker orchestration system");
            throw;
        }
        finally
        {
            _initializationLock.Release();
        }
    }

    public async Task<T> ExecuteAsync<T>(WorkerOperation operation, CancellationToken cancellationToken = default) => await ExecuteAsync<T>(operation, progress: null, cancellationToken);

    public async Task<T> ExecuteAsync<T>(WorkerOperation operation, IProgress<int>? progress, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync();

        WorkerOperationContext context = new(operation.OperationId, cancellationToken)
        {
            Progress = progress
        };

        if (!_activeOperations.TryAdd(operation.OperationId, context))
            throw new InvalidOperationException($"Operation with ID {operation.OperationId} already exists");

        try
        {
            WorkerRequest request = new()
            {
                Id = operation.OperationId,
                Module = operation.Module,
                Operation = operation.Operation,
                Data = operation.Data,
                Metadata = operation.Metadata
            };

            await _jsRuntime.InvokeVoidAsync("BlazorConcurrency.executeOperation", request);
            object? result = await context.CompletionTask;

            return result is T typedResult ? typedResult : JsonSerializer.Deserialize<T>(result?.ToString() ?? "null")!;
        }
        finally
        {
            _activeOperations.TryRemove(operation.OperationId, out _);
            context.Dispose();
        }
    }

    public async Task<T> ExecuteStreamingAsync<T>(WorkerOperation operation, Action<object>? onData = null, Action<string>? onError = null, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync();

        StreamingWorkerOperationContext context = new(operation.OperationId, cancellationToken)
        {
            OnData = onData,
            OnError = onError
        };

        if (!_activeOperations.TryAdd(operation.OperationId, context))
            throw new InvalidOperationException($"Operation with ID {operation.OperationId} already exists");

        try
        {
            WorkerRequest request = new()
            {
                Id = operation.OperationId,
                Module = operation.Module,
                Operation = operation.Operation,
                Data = operation.Data,
                Metadata = operation.Metadata
            };

            await _jsRuntime.InvokeVoidAsync("BlazorConcurrency.executeStreamingOperation", request);
            object? result = await context.CompletionTask;

            return result is T typedResult ? typedResult : JsonSerializer.Deserialize<T>(result?.ToString() ?? "null")!;
        }
        finally
        {
            _activeOperations.TryRemove(operation.OperationId, out _);
            context.Dispose();
        }
    }

    public async Task RegisterModuleAsync(string moduleName, string moduleScriptPath)
    {
        await EnsureInitializedAsync();

        try
        {
            await _jsRuntime.InvokeVoidAsync("BlazorConcurrency.registerModule", moduleName, moduleScriptPath);
            _logger.LogInformation("Registered worker module: {ModuleName}", moduleName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register worker module: {ModuleName}", moduleName);
            throw;
        }
    }

    public async Task<WorkerHealthInfo> GetHealthAsync()
    {
        await EnsureInitializedAsync();

        try
        {
            object healthData = await _jsRuntime.InvokeAsync<object>("BlazorConcurrency.getHealth");
            return JsonSerializer.Deserialize<WorkerHealthInfo>(healthData.ToString()!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get worker health information");
            return new WorkerHealthInfo { IsHealthy = false, Error = ex.Message };
        }
    }

    [JSInvokable]
    public void OnWorkerResponse(WorkerResponse response)
    {
        if (!_activeOperations.TryGetValue(response.Id, out WorkerOperationContext? context))
        {
            _logger.LogWarning("Received response for unknown operation: {OperationId}", response.Id);
            return;
        }

        try
        {
            switch (response.Type.ToUpperInvariant())
            {
                case "SUCCESS":
                    context.SetResult(response.Data);
                    break;

                case "ERROR":
                    WorkerError error = response.Error ?? new WorkerError { Message = "Unknown worker error" };
                    context.SetException(new WorkerOperationException(error.Message, error.Code));
                    break;

                case "PROGRESS":
                    if (response.Data is JsonElement element && element.TryGetInt32(out int progress))
                        context.ReportProgress(progress);
                    break;

                case "STREAM_DATA":
                    if (context is StreamingWorkerOperationContext streamingContext)
                        streamingContext.OnData?.Invoke(response.Data!);
                    break;

                case "STREAM_ERROR":
                    if (context is StreamingWorkerOperationContext streamingErrorContext)
                        streamingErrorContext.OnError?.Invoke(response.Error?.Message ?? "Unknown streaming error");
                    break;

                default:
                    _logger.LogWarning("Unknown response type: {ResponseType}", response.Type);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing worker response for operation {OperationId}", response.Id);
            context.SetException(ex);
        }
    }

    private async Task EnsureInitializedAsync()
    {
        if (!_isInitialized)
            await InitializeAsync();
    }

    public async ValueTask DisposeAsync()
    {
        foreach (WorkerOperationContext context in _activeOperations.Values)
        {
            context.Cancel();
        }
        _activeOperations.Clear();

        if (_isInitialized && _dotNetReference != null)
        {
            try
            {
                await _jsRuntime.InvokeVoidAsync("BlazorConcurrency.dispose");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disposing JavaScript worker resources");
            }
        }

        _dotNetReference?.Dispose();
        _initializationLock.Dispose();
    }
}

/// <summary>
/// Exception thrown when a worker operation fails
/// </summary>
public class WorkerOperationException : Exception
{
    public string? ErrorCode { get; }

    public WorkerOperationException(string message, string? errorCode = null) : base(message) => ErrorCode = errorCode;

    public WorkerOperationException(string message, Exception innerException, string? errorCode = null)
        : base(message, innerException) => ErrorCode = errorCode;
}