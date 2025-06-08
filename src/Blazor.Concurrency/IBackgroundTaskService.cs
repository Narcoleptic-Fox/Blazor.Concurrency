using Blazor.Concurrency.Background;

namespace Blazor.Concurrency;
public interface IBackgroundTaskService
{
    // Data Processing
    Task<T> ProcessDataAsync<T>(object data, IProgress<int>? progress = null, CancellationToken cancellationToken = default);
    Task<T> ProcessDataAsync<T>(object data, string processorType, IProgress<int>? progress = null, CancellationToken cancellationToken = default);

    // Task Execution
    Task<T> ExecuteTaskAsync<T>(string taskType, object payload, IProgress<int>? progress = null, CancellationToken cancellationToken = default);

    // Job Management
    Task<BackgroundJobResult<T>> QueueJobAsync<T>(string jobType, object payload, CancellationToken cancellationToken = default);
    Task<BackgroundJobResult<T>?> GetJobAsync<T>(string jobId, CancellationToken cancellationToken = default);
    Task<bool> CancelJobAsync(string jobId, CancellationToken cancellationToken = default);

    // Parallel Processing
    Task<T[]> ProcessInParallelAsync<T>(ParallelTask[] tasks, IProgress<int>? progress = null, int maxConcurrency = 4, CancellationToken cancellationToken = default);
}
