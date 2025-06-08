using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Cache;

[ExportTsInterface]
public record CacheExistsResult(bool Exists);