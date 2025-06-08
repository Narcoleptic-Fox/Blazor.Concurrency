using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Storage;

[ExportTsInterface]
public record StorageGetKeysResult(string[] Keys);