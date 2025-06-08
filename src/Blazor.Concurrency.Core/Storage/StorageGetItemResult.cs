using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Storage;

[ExportTsInterface]
public record StorageGetItemResult(bool HasValue, object? Value);