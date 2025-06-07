using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Network;

/// <summary>
/// Represents a single request in a batch operation
/// </summary>
[ExportTsInterface]
public record BatchRequest(
    string Url,
    string Method = "GET",
    object? Body = null,
    Dictionary<string, string>? Headers = null
);