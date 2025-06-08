using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Cache;

[ExportTsInterface]
public record CacheSetRequest(string Key, object Value, double? ExpiryMs = null);