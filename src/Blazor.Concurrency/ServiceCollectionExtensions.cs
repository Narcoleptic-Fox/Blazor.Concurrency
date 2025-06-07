using Microsoft.Extensions.DependencyInjection;

namespace Blazor.Concurrency.Services;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds service-oriented interfaces (community-friendly)
    /// </summary>
    public static IServiceCollection AddBlazorConcurrency(this IServiceCollection services)
    {
        services.AddBlazorConcurrencyCore();

        // Register service interfaces
        services.AddScoped<INetworkService, NetworkService>();
        services.AddScoped<IWebSocketService, WebSocketService>();

        return services;
    }
}