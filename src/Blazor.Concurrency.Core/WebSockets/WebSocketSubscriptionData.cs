using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.WebSockets;

/// <summary>
/// Data for WebSocket topic subscription
/// </summary>
[ExportTsInterface]
public record WebSocketSubscriptionData(
    string ConnectionId,
    string Topic
);