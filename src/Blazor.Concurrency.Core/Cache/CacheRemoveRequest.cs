using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Cache;

[ExportTsInterface]
public record CacheRemoveRequest(string Key);
