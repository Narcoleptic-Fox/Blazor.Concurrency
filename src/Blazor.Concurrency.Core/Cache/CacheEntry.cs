using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Cache;

[ExportTsInterface]
public record CacheEntry(object Value, double Timestamp, double? Expiry = null);