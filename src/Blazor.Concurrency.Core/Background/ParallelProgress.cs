using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Represents progress for parallel task execution
/// </summary>
[ExportTsInterface]
public record ParallelProgress(
    int CompletedTasks,
    int TotalTasks,
    Dictionary<string, int> TaskProgress
);