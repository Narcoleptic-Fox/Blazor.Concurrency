using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Request for parallel task execution
/// </summary>
[ExportTsInterface]
public record ParallelTaskRequest(
    ParallelTask[] Tasks
);

/// <summary>
/// Represents a task for parallel execution
/// </summary>
[ExportTsInterface]
public record ParallelTask(
    string TaskType,
    object Payload,
    string? TaskId = null
);