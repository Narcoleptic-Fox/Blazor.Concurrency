using Blazor.Concurrency.RealTime;
using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency;

/// <summary>
/// Provides real-time communication capabilities executed in web workers
/// </summary>
public interface IRealTimeService
{
    // Long Polling
    Task<PollingSubscriptionResult> StartPollingAsync(string url, TimeSpan interval, Action<object> onData, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);

    // Server-Sent Events
    Task<EventSubscriptionResult> ConnectToEventStreamAsync(string url, Action<ServerSentEvent> onEvent, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default);

    // Channels (In-Memory Producer/Consumer)
    Task<ChannelResult> CreateChannelAsync<T>(string channelName, int capacity = 100, CancellationToken cancellationToken = default);

    // Push Notifications (if supported by browser)
    Task<PushSubscription> SubscribeToPushNotificationsAsync(string publicKey, Action<object> onMessage, CancellationToken cancellationToken = default);
}

public record PushSubscription(string SubscriptionId, bool IsActive, Task UnsubscribeAsync, Action<PushMessage>? OnMessage = null);
public record PushMessage(string Title, string Body, string? Icon = null, string? Badge = null, object? Data = null);

internal class RealTimeService : IRealTimeService
{
    private readonly IWorkerExecutor _workerExecutor;

    public RealTimeService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<PollingSubscriptionResult> StartPollingAsync(string url, TimeSpan interval, Action<object> onData, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.RealTime("startPolling", new { url, intervalMs = (int)interval.TotalMilliseconds, headers });
        PollingSubscriptionResult result = await _workerExecutor.ExecuteStreamingAsync<PollingSubscriptionResult>(operation, cancellationToken: cancellationToken);

        return result;
    }

    public async Task<EventSubscriptionResult> ConnectToEventStreamAsync(string url, Action<ServerSentEvent> onEvent, Dictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.RealTime("connectEventStream", new { url, headers });
        EventSubscriptionResult result = await _workerExecutor.ExecuteStreamingAsync<EventSubscriptionResult>(operation, cancellationToken: cancellationToken);

        return result;
    }

    public async Task<ChannelResult> CreateChannelAsync<T>(string channelName, int capacity = 100, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.RealTime("createChannel", new { channelName, capacity });
        ChannelResult result = await _workerExecutor.ExecuteAsync<ChannelResult>(operation, cancellationToken);

        return result;
    }

    public async Task<PushSubscription> SubscribeToPushNotificationsAsync(string publicKey, Action<object> onMessage, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.RealTime("subscribePush", new { publicKey });
        PushSubscription result = await _workerExecutor.ExecuteStreamingAsync<PushSubscription>(operation, onMessage, cancellationToken: cancellationToken);

        return result;
    }
}
