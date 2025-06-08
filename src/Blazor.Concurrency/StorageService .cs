using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency;

internal class StorageService : IStorageService
{
    private readonly IWorkerExecutor _workerExecutor;

    public StorageService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<T?> GetItemAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("storage", "getItem", new { key });
        StorageGetResult<T> result = await _workerExecutor.ExecuteAsync<StorageGetResult<T>>(operation, cancellationToken);
        return result.HasValue ? result.Value : default;
    }

    public async Task SetItemAsync<T>(string key, T value, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("storage", "setItem", new { key, value });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task<bool> RemoveItemAsync(string key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("storage", "removeItem", new { key });
        StorageRemoveResult result = await _workerExecutor.ExecuteAsync<StorageRemoveResult>(operation, cancellationToken);
        return result.Success;
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("storage", "clear", new { });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task<int> GetLengthAsync(CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("storage", "getLength", new { });
        StorageLengthResult result = await _workerExecutor.ExecuteAsync<StorageLengthResult>(operation, cancellationToken);
        return result.Length;
    }

    public async Task<string[]> GetKeysAsync(CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("storage", "getKeys", new { });
        StorageKeysResult result = await _workerExecutor.ExecuteAsync<StorageKeysResult>(operation, cancellationToken);
        return result.Keys;
    }
}

internal record StorageGetResult<T>(bool HasValue, T? Value);
internal record StorageRemoveResult(bool Success);
internal record StorageLengthResult(int Length);
internal record StorageKeysResult(string[] Keys);