using Blazor.Concurrency.Background;
using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency;
internal class BackgroundTaskService : IBackgroundTaskService
{
    private readonly IWorkerExecutor _workerExecutor;

    public BackgroundTaskService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<bool> CancelJobAsync(string jobId, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("cancelJob", new { jobId });

        try
        {
            await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<T> ExecuteTaskAsync<T>(string taskType, object payload, IProgress<int>? progress = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("executeTask", new { taskType, payload });
        return await _workerExecutor.ExecuteAsync<T>(operation, progress, cancellationToken);
    }

    public async Task<BackgroundJobResult<T>?> GetJobAsync<T>(string jobId, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("getJobStatus", new { jobId });

        try
        {
            BackgroundJobResult<T> result = await _workerExecutor.ExecuteAsync<BackgroundJobResult<T>>(operation, cancellationToken);
            return result;
        }
        catch
        {
            return null;
        }
    }

    public async Task<T> ProcessDataAsync<T>(object data, IProgress<int>? progress = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("processData", new { data });
        return await _workerExecutor.ExecuteAsync<T>(operation, progress, cancellationToken);
    }

    public async Task<T> ProcessDataAsync<T>(object data, string processorType, IProgress<int>? progress = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("processData", new { data, processorType });
        return await _workerExecutor.ExecuteAsync<T>(operation, progress, cancellationToken);
    }

    public async Task<T[]> ProcessInParallelAsync<T>(ParallelTask[] tasks, IProgress<int>? progress = null, int maxConcurrency = 4, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("processParallel", new { tasks, maxConcurrency });
        return await _workerExecutor.ExecuteAsync<T[]>(operation, progress, cancellationToken);
    }

    public async Task<BackgroundJobResult<T>> QueueJobAsync<T>(string jobType, object payload, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Background("queueJob", new { jobType, payload });
        BackgroundJobResult<T> result = await _workerExecutor.ExecuteAsync<BackgroundJobResult<T>>(operation, cancellationToken);

        return result;
    }
}