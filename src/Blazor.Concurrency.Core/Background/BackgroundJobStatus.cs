using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Background job status enumeration
/// </summary>
[ExportTsEnum]
public enum BackgroundJobStatus
{
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled
}