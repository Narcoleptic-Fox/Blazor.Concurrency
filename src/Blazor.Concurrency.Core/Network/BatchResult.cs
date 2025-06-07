using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Network;

/// <summary>
/// Contains the results of a batch request operation
/// </summary>
[ExportTsInterface]
public class BatchResult<T>
{
    public T[] Results { get; init; } = Array.Empty<T>();
    public BatchRequestError[] Errors { get; init; } = Array.Empty<BatchRequestError>();
    public bool HasErrors => Errors.Any();
    public bool IsSuccess => !HasErrors;
    public int TotalRequests => Results.Length + Errors.Length;
    public int SuccessfulRequests => Results.Length;
    public int FailedRequests => Errors.Length;
}

/// <summary>
/// Represents an error that occurred during a batch request
/// </summary>
[ExportTsInterface]
public record BatchRequestError(
    int Index,
    string Url,
    string ErrorMessage,
    string? ErrorCode = null
);