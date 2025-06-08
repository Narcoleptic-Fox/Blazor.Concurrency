namespace Blazor.Concurrency;

/// <summary>
/// Provides secure client-side storage using IndexedDB
/// </summary>
public interface IStorageService
{
    Task<T?> GetItemAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetItemAsync<T>(string key, T value, CancellationToken cancellationToken = default);
    Task<bool> RemoveItemAsync(string key, CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
    Task<int> GetLengthAsync(CancellationToken cancellationToken = default);
    Task<string[]> GetKeysAsync(CancellationToken cancellationToken = default);
}
