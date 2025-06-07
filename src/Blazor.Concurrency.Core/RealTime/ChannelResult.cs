using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Result of channel creation
/// </summary>
[ExportTsInterface]
public record ChannelResult(
    string ChannelName,
    int Capacity,
    bool IsCreated
);

/// <summary>
/// Channel data received from worker
/// </summary>
[ExportTsInterface]
public record ChannelDataReceived(
    string ChannelName,
    object? Data = null,
    bool Completed = false,
    DateTime Timestamp = default
);

/// <summary>
/// Channel read operation result
/// </summary>
[ExportTsInterface]
public record ChannelReadResult(
    bool Success,
    string ChannelName,
    string ReaderId,
    int BufferedItems
);