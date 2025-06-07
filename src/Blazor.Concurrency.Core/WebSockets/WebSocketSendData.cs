using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.WebSockets;

/// <summary>
/// Data for WebSocket send operations
/// </summary>
[ExportTsInterface]
public record WebSocketSendData(
    string ConnectionId,
    object Message,
    WebSocketMessageType MessageType = WebSocketMessageType.Json
);

/// <summary>
/// WebSocket message types
/// </summary>
[ExportTsEnum]
public enum WebSocketMessageType
{
    Text,
    Json,
    Binary
}