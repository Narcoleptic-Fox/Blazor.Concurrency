using Blazor.Concurrency.Network;

namespace Blazor.Concurrency;

/// <summary>
/// Provides HTTP operations executed in web workers for non-blocking network requests
/// </summary>
public interface INetworkService
{
    // Basic HTTP Methods
    Task<T> GetAsync<T>(string url, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> PostAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> PutAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> PatchAsync<T>(string url, object? body = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task DeleteAsync(string url, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);

    // Advanced Operations
    Task<T> RequestWithRetryAsync<T>(string url, string method = "GET", object? body = null, Dictionary<string, string>? headers = null, int maxRetries = 3, CancellationToken cancellationToken = default);
    Task<BatchResult<T>[]> BatchRequestAsync<T>(BatchRequest[] requests, CancellationToken cancellationToken = default);

    // File Operations
    Task<byte[]> DownloadFileAsync(string url, IProgress<int>? progress = null, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);
    Task<T> UploadFileAsync<T>(string url, byte[] fileData, string fileName, string? contentType = null, Dictionary<string, string>? headers = null, IProgress<int>? progress = null, CancellationToken cancellationToken = default);
}
