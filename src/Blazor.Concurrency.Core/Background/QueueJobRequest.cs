using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Request for job queueing operations
/// </summary>
[ExportTsInterface]
public record QueueJobRequest(
    string JobType,
    object Parameters,
    int Priority = 0
);

/// <summary>
/// Get job status request
/// </summary>
[ExportTsInterface]
public record GetJobStatusRequest(
    string JobId
);

/// <summary>
/// Cancel job request
/// </summary>
[ExportTsInterface]
public record CancelJobRequest(
    string JobId
);