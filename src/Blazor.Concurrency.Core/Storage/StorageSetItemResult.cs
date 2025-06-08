using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Storage;

[ExportTsInterface]
public record StorageSetItemResult(bool Success);