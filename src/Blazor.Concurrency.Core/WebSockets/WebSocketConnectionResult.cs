using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.WebSockets;

/// <summary>
/// Result of WebSocket connection operation
/// </summary>
[ExportTsInterface]
public record WebSocketConnectionResult(
    string ConnectionId,
    bool IsConnected,
    string Url
);