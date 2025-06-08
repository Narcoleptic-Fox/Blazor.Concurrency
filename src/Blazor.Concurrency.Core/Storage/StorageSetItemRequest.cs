using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Storage;

[ExportTsInterface]
public record StorageSetItemRequest(string Key, object Value);
