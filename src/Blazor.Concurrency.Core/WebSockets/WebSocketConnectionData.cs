using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.WebSockets;

/// <summary>
/// Data for WebSocket connection requests
/// </summary>
[ExportTsInterface]
public record WebSocketConnectionData(
    string Url,
    string[] Protocols,
    bool AutoReconnect = true
);