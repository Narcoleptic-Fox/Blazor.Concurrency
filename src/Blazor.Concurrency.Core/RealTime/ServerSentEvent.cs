using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.RealTime;

/// <summary>
/// Represents a server-sent event
/// </summary>
[ExportTsInterface]
public record ServerSentEvent(
    string? Id,
    string? Type,
    string Data,
    int? Retry = null
);