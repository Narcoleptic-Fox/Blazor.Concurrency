using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Workers;

/// <summary>
/// Core interface for executing operations in web workers
/// This is the single abstraction both service and CRISP layers use
/// </summary>
public interface IWorkerExecutor
{
    /// <summary>
    /// Execute a worker operation and return the result
    /// </summary>
    Task<T> ExecuteAsync<T>(WorkerOperation operation, CancellationToken cancellationToken = default);

    /// <summary>
    /// Execute a worker operation with progress reporting
    /// </summary>
    Task<T> ExecuteAsync<T>(WorkerOperation operation, IProgress<int>? progress, CancellationToken cancellationToken = default);

    /// <summary>
    /// Execute a streaming operation (WebSocket, SSE, etc.)
    /// </summary>
    Task<T> ExecuteStreamingAsync<T>(WorkerOperation operation, Action<object>? onData = null, Action<string>? onError = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Initialize the worker system
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Register a worker module
    /// </summary>
    Task RegisterModuleAsync(string moduleName, string moduleScriptPath);

    /// <summary>
    /// Get worker system health information
    /// </summary>
    Task<WorkerHealthInfo> GetHealthAsync();
}

/// <summary>
/// Worker system health information
/// </summary>
[ExportTsInterface]
public record WorkerHealthInfo
{
    public bool IsHealthy { get; init; }
    public string? Error { get; init; }
    public int ActiveOperations { get; init; }
    public string[] RegisteredModules { get; init; } = Array.Empty<string>();
    public Dictionary<string, object>? Metrics { get; init; }
}