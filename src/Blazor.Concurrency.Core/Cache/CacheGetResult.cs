using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Cache;

[ExportTsInterface]
public record CacheGetResult(bool HasValue, object? Value);