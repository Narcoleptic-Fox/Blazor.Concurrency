using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.WebSockets;

/// <summary>
/// Data for WebSocket close operations
/// </summary>
[ExportTsInterface]
public record WebSocketCloseData(
    string ConnectionId,
    int Code = 1000,
    string Reason = ""
);