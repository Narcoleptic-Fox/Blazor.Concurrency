using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Request for task execution operations
/// </summary>
[ExportTsInterface]
public record ExecuteTaskRequest(
    string TaskType,
    object Payload
);