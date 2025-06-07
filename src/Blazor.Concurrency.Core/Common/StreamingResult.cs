using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Common;

/// <summary>
/// Result for streaming operations
/// </summary>
[ExportTsInterface]
public record StreamingResult<T>(
    string StreamId,
    bool IsActive,
    T? InitialData = default
);

/// <summary>
/// Streaming data update
/// </summary>
[ExportTsInterface]
public record StreamingDataUpdate(
    string StreamId,
    object Data,
    DateTime Timestamp
);

/// <summary>
/// Streaming error update
/// </summary>
[ExportTsInterface]
public record StreamingErrorUpdate(
    string StreamId,
    string Error,
    DateTime Timestamp
);