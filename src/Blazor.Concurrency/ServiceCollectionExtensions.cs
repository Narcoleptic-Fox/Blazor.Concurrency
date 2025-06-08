using Microsoft.Extensions.DependencyInjection;

namespace Blazor.Concurrency.Services;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds service-oriented interfaces (community-friendly)
    /// </summary>
    public static IServiceCollection AddBlazorConcurrency(this IServiceCollection services)
    {
        // Add core worker orchestration
        services.AddBlazorConcurrencyCore();

        // Register all service interfaces
        services.AddScoped<INetworkService, NetworkService>();
        services.AddScoped<IWebSocketService, WebSocketService>();
        services.AddScoped<IRealTimeService, RealTimeService>();
        services.AddScoped<IBackgroundTaskService, BackgroundTaskService>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<IStorageService, StorageService>();
        services.AddScoped<ICryptographyService, CryptographyService>();

        return services;
    }
}