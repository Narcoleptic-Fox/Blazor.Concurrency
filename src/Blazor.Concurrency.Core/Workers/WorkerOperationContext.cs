namespace Blazor.Concurrency.Workers;

/// <summary>
/// Context for tracking worker operations
/// </summary>
public class WorkerOperationContext : IDisposable
{
    private readonly CancellationTokenSource _cancellationTokenSource;
    private readonly TaskCompletionSource<object?> _completionSource;

    public WorkerOperationContext(string operationId, CancellationToken cancellationToken = default)
    {
        OperationId = operationId;
        _cancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _completionSource = new TaskCompletionSource<object?>();
        CancellationToken = _cancellationTokenSource.Token;
    }

    public string OperationId { get; }
    public CancellationToken CancellationToken { get; }
    public Task<object?> CompletionTask => _completionSource.Task;
    public IProgress<int>? Progress { get; set; }
    public Dictionary<string, object> Metadata { get; } = [];

    public void SetResult(object? result) => _completionSource.TrySetResult(result);

    public void SetException(Exception exception) => _completionSource.TrySetException(exception);

    public void Cancel()
    {
        _cancellationTokenSource.Cancel();
        _completionSource.TrySetCanceled();
    }

    public void ReportProgress(int progressPercentage) => Progress?.Report(progressPercentage);

    public void Dispose() => _cancellationTokenSource.Dispose();
}

/// <summary>
/// Context for streaming operations
/// </summary>
public class StreamingWorkerOperationContext : WorkerOperationContext
{
    public StreamingWorkerOperationContext(string operationId, CancellationToken cancellationToken = default)
        : base(operationId, cancellationToken)
    {
    }

    public Action<object>? OnData { get; set; }
    public Action<string>? OnError { get; set; }
}