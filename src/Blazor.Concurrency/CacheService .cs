using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency;

internal record CacheGetResult<T>(bool HasValue, T? Value);
internal record CacheRemoveResult(bool Success);
internal record CacheKeysResult(string[] Keys);
internal record CacheExistsResult(bool Exists);

internal class CacheService : ICacheService
{
    private readonly IWorkerExecutor _workerExecutor;

    public CacheService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("cache", "get", new { key });
        CacheGetResult<T> result = await _workerExecutor.ExecuteAsync<CacheGetResult<T>>(operation, cancellationToken);
        return result.HasValue ? result.Value : default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("cache", "set", new { key, value, expiryMs = expiry?.TotalMilliseconds });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task<bool> RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("cache", "remove", new { key });
        CacheRemoveResult result = await _workerExecutor.ExecuteAsync<CacheRemoveResult>(operation, cancellationToken);
        return result.Success;
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("cache", "clear", new { });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task<string[]> GetKeysAsync(string? pattern = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("cache", "getKeys", new { pattern });
        CacheKeysResult result = await _workerExecutor.ExecuteAsync<CacheKeysResult>(operation, cancellationToken);
        return result.Keys;
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("cache", "exists", new { key });
        CacheExistsResult result = await _workerExecutor.ExecuteAsync<CacheExistsResult>(operation, cancellationToken);
        return result.Exists;
    }
}
