using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Network;

/// <summary>
/// HTTP response data from workers
/// </summary>
[ExportTsInterface]
public record HttpResponse(
    object? Data,
    int StatusCode,
    string? ContentType = null,
    Dictionary<string, string>? Headers = null
);

/// <summary>
/// Binary HTTP response data
/// </summary>
[ExportTsInterface]
public record BinaryHttpResponse(
    int[] Data,
    string ContentType,
    int Size
);