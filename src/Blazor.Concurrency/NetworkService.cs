using Blazor.Concurrency.Network;
using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency;

internal class NetworkService : INetworkService
{
    private readonly IWorkerExecutor _workerExecutor;

    public NetworkService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<T> GetAsync<T>(string url, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("get", new { url, headers });
        return await _workerExecutor.ExecuteAsync<T>(operation, cancellationToken);
    }

    public async Task<T> PostAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("post", new { url, body, headers });
        return await _workerExecutor.ExecuteAsync<T>(operation, cancellationToken);
    }

    public async Task<T> PutAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("put", new { url, body, headers });
        return await _workerExecutor.ExecuteAsync<T>(operation, cancellationToken);
    }

    public async Task<T> PatchAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("patch", new { url, body, headers });
        return await _workerExecutor.ExecuteAsync<T>(operation, cancellationToken);
    }

    public async Task DeleteAsync(string url, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("delete", new { url, headers });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task<T> RequestWithRetryAsync<T>(string url, string method = "GET", object? body = null, Dictionary<string, string>? headers = null, int maxRetries = 3, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("requestWithRetry", new { url, method, body, headers, maxRetries });
        return await _workerExecutor.ExecuteAsync<T>(operation, cancellationToken);
    }

    public async Task<BatchResult<T>[]> BatchRequestAsync<T>(BatchRequest[] requests, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("batch", new { requests });
        return await _workerExecutor.ExecuteAsync<BatchResult<T>[]>(operation, cancellationToken);
    }

    public async Task<byte[]> DownloadFileAsync(string url, IProgress<int>? progress = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("downloadFile", new { url, headers });
        return await _workerExecutor.ExecuteAsync<byte[]>(operation, progress, cancellationToken);
    }

    public async Task<T> UploadFileAsync<T>(string url, byte[] fileData, string fileName, string? contentType = null, Dictionary<string, string>? headers = null, IProgress<int>? progress = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Http("uploadFile", new { url, fileData, fileName, contentType, headers });
        return await _workerExecutor.ExecuteAsync<T>(operation, progress, cancellationToken);
    }
}
