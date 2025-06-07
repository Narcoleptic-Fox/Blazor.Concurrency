using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Common;

/// <summary>
/// Generic operation result
/// </summary>
[ExportTsInterface]
public record OperationResult<T>(
    bool IsSuccess,
    T? Data = default,
    string? Error = null,
    string? ErrorCode = null
);

/// <summary>
/// Simple success result
/// </summary>
[ExportTsInterface]
public record SuccessResult(
    bool Success,
    string? Message = null
);