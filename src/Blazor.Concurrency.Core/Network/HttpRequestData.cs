using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Network;

/// <summary>
/// Data for HTTP request operations sent to workers
/// </summary>
[ExportTsInterface]
public record HttpRequestData(
    string Url,
    string Method = "GET",
    object? Body = null,
    Dictionary<string, string>? Headers = null,
    int MaxRetries = 3,
    int? TimeoutMs = null
);

/// <summary>
/// Batch HTTP request data
/// </summary>
[ExportTsInterface]
public record HttpBatchRequestData(
    BatchRequest[] Requests
);

/// <summary>
/// HTTP retry request data
/// </summary>
[ExportTsInterface]
public record HttpRetryRequestData(
    string Url,
    string Method = "GET",
    object? Body = null,
    Dictionary<string, string>? Headers = null,
    int MaxRetries = 3
);