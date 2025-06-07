using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency.Services;

public interface IWebSocketService
{
    Task<IWebSocketConnection> ConnectAsync(string url, string[]? protocols = null, CancellationToken cancellationToken = default);
}

public interface IWebSocketConnection : IAsyncDisposable
{
    string ConnectionId { get; }
    bool IsConnected { get; }
    string Url { get; }
    Task SendAsync(object message, CancellationToken cancellationToken = default);
    Task SendAsync(string message, CancellationToken cancellationToken = default);
    Task SendAsync(byte[] data, CancellationToken cancellationToken = default);
    Task CloseAsync(CancellationToken cancellationToken = default);
    event Action<object>? OnMessage;
    event Action<string>? OnError;
    event Action? OnClosed;
    event Action? OnOpened;
}

internal class WebSocketService : IWebSocketService
{
    private readonly IWorkerExecutor _workerExecutor;

    public WebSocketService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<IWebSocketConnection> ConnectAsync(string url, string[]? protocols = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.WebSocket("connect", new { url, protocols });
        WebSocketConnectionResult result = await _workerExecutor.ExecuteStreamingAsync<WebSocketConnectionResult>(
            operation,
            cancellationToken: cancellationToken);

        return new WebSocketConnection(result.ConnectionId, url, _workerExecutor);
    }
}

internal record WebSocketConnectionResult(string ConnectionId, bool IsConnected);

internal class WebSocketConnection : IWebSocketConnection
{
    private readonly string _connectionId;
    private readonly IWorkerExecutor _workerExecutor;

    public WebSocketConnection(string connectionId, string url, IWorkerExecutor workerExecutor)
    {
        _connectionId = connectionId;
        Url = url;
        _workerExecutor = workerExecutor;
        IsConnected = true;
    }

    public string ConnectionId => _connectionId;
    public bool IsConnected { get; private set; }
    public string Url { get; }

    public event Action<object>? OnMessage;
    public event Action<string>? OnError;
    public event Action? OnClosed;
    public event Action? OnOpened;

    public async Task SendAsync(object message, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.WebSocket("send", new { connectionId = _connectionId, message, messageType = "json" });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task SendAsync(string message, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.WebSocket("send", new { connectionId = _connectionId, message, messageType = "text" });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task SendAsync(byte[] data, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.WebSocket("send", new { connectionId = _connectionId, message = data, messageType = "binary" });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
    }

    public async Task CloseAsync(CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.WebSocket("close", new { connectionId = _connectionId });
        await _workerExecutor.ExecuteAsync<object>(operation, cancellationToken);
        IsConnected = false;
    }

    public async ValueTask DisposeAsync()
    {
        if (IsConnected)
        {
            await CloseAsync();
        }
    }
}