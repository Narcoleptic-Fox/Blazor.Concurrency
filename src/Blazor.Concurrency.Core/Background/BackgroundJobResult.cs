using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Result of background job queueing
/// </summary>
[ExportTsInterface]
public record BackgroundJobResult<T>(
    string JobId,
    BackgroundJobStatus Status,
    int? QueuePosition = null,
    T? Result = default
);

/// <summary>
/// Background job status information
/// </summary>
[ExportTsInterface]
public record BackgroundJobStatusInfo(
    string JobId,
    BackgroundJobStatus Status,
    int Progress,
    object? Result = null,
    string? Error = null
);

/// <summary>
/// Background job update from worker
/// </summary>
[ExportTsInterface]
public record BackgroundJobUpdate(
    string JobId,
    BackgroundJobStatus Status,
    int? Progress = null,
    object? Result = null,
    string? Error = null
);