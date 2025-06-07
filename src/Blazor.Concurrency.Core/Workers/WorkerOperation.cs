using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Workers;

/// <summary>
/// Represents a worker operation request - completely agnostic to consumption patterns
/// </summary>
[ExportTsInterface]
public class WorkerOperation
{
    public required string Module { get; init; }
    public required string Operation { get; init; }
    public object? Data { get; init; }
    public Dictionary<string, object> Metadata { get; init; } = [];
    public string OperationId { get; init; } = Guid.NewGuid().ToString();

    // Factory methods for common patterns
    public static WorkerOperation Create(string module, string operation, object? data = null)
        => new() { Module = module, Operation = operation, Data = data };

    public static WorkerOperation Http(string operation, object data)
        => Create("http", operation, data);

    public static WorkerOperation WebSocket(string operation, object data)
        => Create("websocket", operation, data);

    public static WorkerOperation Background(string operation, object data)
        => Create("background", operation, data);

    public static WorkerOperation RealTime(string operation, object data)
        => Create("realtime", operation, data);

    // Fluent API for metadata
    public WorkerOperation WithMetadata(string key, object value)
    {
        Metadata[key] = value;
        return this;
    }

    public WorkerOperation WithAuth(string token)
        => WithMetadata("authToken", token);

    public WorkerOperation WithRetry(int maxRetries)
        => WithMetadata("maxRetries", maxRetries);

    public WorkerOperation WithTimeout(int timeoutMs)
        => WithMetadata("timeout", timeoutMs);
}

/// <summary>
/// Worker request message format
/// </summary>
[ExportTsInterface]
public record WorkerRequest
{
    public required string Id { get; init; }
    public required string Module { get; init; }
    public required string Operation { get; init; }
    public object? Data { get; init; }
    public Dictionary<string, object>? Metadata { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}

/// <summary>
/// Worker response message format
/// </summary>
[ExportTsInterface]
public record WorkerResponse
{
    public required string Id { get; init; }
    public required string Type { get; init; } // SUCCESS, ERROR, PROGRESS
    public object? Data { get; init; }
    public WorkerError? Error { get; init; }
    public Dictionary<string, object>? Metadata { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}

/// <summary>
/// Worker error information
/// </summary>
[ExportTsInterface]
public record WorkerError
{
    public required string Message { get; init; }
    public string? Code { get; init; }
    public string? StackTrace { get; init; }
    public Dictionary<string, object>? Details { get; init; }
}