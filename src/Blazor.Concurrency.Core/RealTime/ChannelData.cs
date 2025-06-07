using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Data for channel creation
/// </summary>
[ExportTsInterface]
public record ChannelData(
    string ChannelName,
    int Capacity = 100
);

/// <summary>
/// Data for channel write operations
/// </summary>
[ExportTsInterface]
public record ChannelWriteData(
    string ChannelName,
    object Data
);

/// <summary>
/// Data for channel read operations
/// </summary>
[ExportTsInterface]
public record ChannelReadData(
    string ChannelName,
    string? ReaderId = null
);

/// <summary>
/// Data for channel completion
/// </summary>
[ExportTsInterface]
public record ChannelCompleteData(
    string ChannelName
);