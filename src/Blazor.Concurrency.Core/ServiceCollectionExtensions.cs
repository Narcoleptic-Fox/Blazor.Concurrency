using Blazor.Concurrency.Workers;
using Microsoft.Extensions.DependencyInjection;

namespace Blazor.Concurrency;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers just the core worker orchestration engine
    /// </summary>
    public static IServiceCollection AddBlazorConcurrencyCore(this IServiceCollection services)
    {
        services.AddScoped<WorkerOrchestrationService>();
        services.AddScoped<IWorkerExecutor>(provider => provider.GetRequiredService<WorkerOrchestrationService>());

        return services;
    }
}