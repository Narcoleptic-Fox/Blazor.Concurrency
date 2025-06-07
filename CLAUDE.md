# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Blazor WebAssembly worker orchestration framework that provides true multithreading capabilities through lightweight JavaScript workers with clean C# service abstractions. The framework allows Blazor applications to execute CPU-intensive tasks, network operations, WebSocket connections, and real-time communications off the main UI thread.

## Architecture

### Core Components
- **Worker Orchestration Service**: Central coordinator that manages all worker operations and message passing between C# and JavaScript workers
- **Service Interfaces**: Clean abstractions for different types of background operations (INetworkService, IWebSocketService, IRealTimeService, IBackgroundTaskService)
- **Worker Message Contracts**: Type-safe communication protocol between main thread and workers
- **JavaScript Worker Modules**: Specialized worker implementations for different operation types (HTTP, WebSocket, RealTime, Background)

### Project Structure
The implementation follows a modular architecture with these key directories:
- `src/Blazor.Concurrency.Core/` - Core framework with interfaces and orchestration
- `src/Blazor.Concurrency.Authentication/` - Authentication integration
- `src/Blazor.Concurrency.Extensions/` - Built-in extensions
- `src/Blazor.Concurrency.Hosting/` - Dependency injection and hosting
- `samples/` - Demo applications showing usage patterns
- `tests/` - Unit, integration, and performance tests
- `assets/js/workers/` - JavaScript worker implementation files

### Key Design Patterns
- All worker services implement `IWorkerService` for consistent registration
- Worker operations use async/await with cancellation token support
- Progress reporting through `IProgress<T>` interface
- Auto-retry mechanisms with exponential backoff
- Resource management with proper disposal patterns
- Event-driven communication for real-time scenarios

## Development Commands

Based on the project structure, typical .NET development commands would be:

**Note**: .NET 9 SDK is installed at `~/.dotnet/dotnet` (not in system PATH)

```bash
# Build the solution
dotnet build

# Run tests
dotnet test

# Pack NuGet packages
dotnet pack

# Run specific test project
dotnet test tests/Blazor.Concurrency.Core.Tests/

# Run sample applications
dotnet run --project samples/BasicUsage/
dotnet run --project samples/AuthenticationDemo/
dotnet run --project samples/AdvancedScenarios/
```

## Implementation Guidelines

### Service Implementation
- All new services must implement `IWorkerService` and follow the established naming conventions
- Use the `WorkerOrchestrationService.ExecuteAsync<T>()` method for all worker communications
- Implement proper error handling with `WorkerOperationException`
- Support cancellation tokens in all async operations
- Report progress for long-running operations when appropriate

### JavaScript Worker Modules
- Extend `BaseModule` class for new worker modules
- Register modules in the `WorkerOrchestrator.initialize()` method
- Use consistent naming: operation handlers should be named `handle{OperationName}`
- Implement proper error handling and send structured responses
- Support both JSON and binary message types where applicable

### Testing Strategy
- Unit tests for all service interfaces and implementations
- Integration tests for worker orchestration scenarios
- Performance tests for concurrent operation handling
- Mock JavaScript workers for isolated C# testing

### Package Dependencies
The core framework targets .NET 8.0 and uses:
- Microsoft.AspNetCore.Components.WebAssembly
- Microsoft.Extensions.Logging.Abstractions
- Microsoft.Extensions.DependencyInjection.Abstractions
- System.Text.Json

## Worker Communication Protocol

### Message Flow
1. C# service calls `WorkerOrchestrationService.ExecuteAsync()`
2. Creates `WorkerRequest` with module, operation, and data
3. JavaScript `WorkerOrchestrator` routes to appropriate module
4. Module executes operation and sends `WorkerResponse`
5. C# orchestrator processes response and completes Task

### Response Types
- `SUCCESS`: Operation completed successfully
- `ERROR`: Operation failed with error details
- `PROGRESS`: Progress update for long-running operations
- `WEBSOCKET_MESSAGE`: WebSocket message received
- `WEBSOCKET_EVENT`: WebSocket state changes

## Resource Management

### Memory Management
- Dispose worker contexts after operations complete
- Clean up JavaScript resources on service disposal
- Monitor active operation counts to prevent memory leaks

### Connection Pooling
- WebSocket connections support auto-reconnect with exponential backoff
- HTTP operations can be batched for efficiency
- Background tasks queue properly to prevent thread starvation

## Error Handling

### C# Exception Types
- `WorkerOperationException`: Base exception for worker failures
- Include error codes for categorizing failures
- Preserve stack traces and inner exceptions

### JavaScript Error Handling
- Structured error responses with message, code, and stack trace
- Retry logic for transient failures
- Graceful degradation when workers are unavailable