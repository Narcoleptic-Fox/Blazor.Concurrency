using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Cache;

[ExportTsInterface]
public record CacheClearResult(bool Success);