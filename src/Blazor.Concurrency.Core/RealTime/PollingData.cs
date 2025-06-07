using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Data for long polling operations
/// </summary>
[ExportTsInterface]
public record PollingData(
    string Url,
    int IntervalMs,
    string SubscriptionId
);

/// <summary>
/// Change polling interval data
/// </summary>
[ExportTsInterface]
public record ChangePollingIntervalData(
    string SubscriptionId,
    int NewIntervalMs
);

/// <summary>
/// Stop polling data
/// </summary>
[ExportTsInterface]
public record StopPollingData(
    string SubscriptionId
);