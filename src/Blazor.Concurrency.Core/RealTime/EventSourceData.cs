using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Data for server-sent events subscription
/// </summary>
[ExportTsInterface]
public record EventSourceData(
    string Url,
    string? LastEventId = null
);

/// <summary>
/// Unsubscribe from events data
/// </summary>
[ExportTsInterface]
public record UnsubscribeEventsData(
    string SubscriptionId
);