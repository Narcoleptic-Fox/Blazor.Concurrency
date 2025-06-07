using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency.Services;

/// <summary>
/// Provides HTTP operations executed in web workers for non-blocking network requests
/// </summary>
public interface INetworkService
{
    Task<T> GetAsync<T>(string url, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> PostAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> PutAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> PatchAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task DeleteAsync(string url, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> RequestWithRetryAsync<T>(string url, string method = "GET", object? body = null, Dictionary<string, string>? headers = null, int maxRetries = 3, CancellationToken cancellationToken = default);
}

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
        WorkerOperation operation = WorkerOperation
            .Http("retry", new { url, method, body, headers })
            .WithRetry(maxRetries);

        return await _workerExecutor.ExecuteAsync<T>(operation, cancellationToken);
    }
}