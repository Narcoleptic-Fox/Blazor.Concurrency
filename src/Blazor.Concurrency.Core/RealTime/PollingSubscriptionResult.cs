using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Result of polling subscription operation
/// </summary>
[ExportTsInterface]
public record PollingSubscriptionResult(
    string SubscriptionId,
    bool IsActive,
    int IntervalMs
);

/// <summary>
/// Polling data received from worker
/// </summary>
[ExportTsInterface]
public record PollingDataReceived(
    string SubscriptionId,
    object Data,
    DateTime Timestamp
);