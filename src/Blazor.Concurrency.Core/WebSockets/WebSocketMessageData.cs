using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.WebSockets;

/// <summary>
/// WebSocket message data from workers
/// </summary>
[ExportTsInterface]
public record WebSocketMessageData(
    string ConnectionId,
    WebSocketMessageInfo Message
);

/// <summary>
/// WebSocket message information
/// </summary>
[ExportTsInterface]
public record WebSocketMessageInfo(
    WebSocketMessageType Type,
    object Data
);

/// <summary>
/// WebSocket event data
/// </summary>
[ExportTsInterface]
public record WebSocketEventData(
    string ConnectionId,
    WebSocketEventType Event,
    int? Code = null,
    string? Reason = null
);

/// <summary>
/// WebSocket event types
/// </summary>
[ExportTsEnum]
public enum WebSocketEventType
{
    Opened,
    Closed,
    Error
}