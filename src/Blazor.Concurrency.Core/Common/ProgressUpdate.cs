using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Common;

/// <summary>
/// Progress update information
/// </summary>
[ExportTsInterface]
public record ProgressUpdate(
    string OperationId,
    int Percentage,
    string? Message = null,
    Dictionary<string, object>? Metadata = null
);