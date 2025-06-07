using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Result of event subscription operation
/// </summary>
[ExportTsInterface]
public record EventSubscriptionResult(
    string SubscriptionId,
    bool IsActive,
    string Url
);