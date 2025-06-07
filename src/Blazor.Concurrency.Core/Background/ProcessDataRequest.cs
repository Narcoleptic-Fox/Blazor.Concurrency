using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Background;

/// <summary>
/// Request for data processing operations
/// </summary>
[ExportTsInterface]
public record ProcessDataRequest(
    object Data,
    string ProcessorType = "default"
);