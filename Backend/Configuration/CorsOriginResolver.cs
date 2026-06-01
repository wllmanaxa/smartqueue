namespace Backend.Configuration;

public static class CorsOriginResolver
{
    public static string[] Resolve(
        IConfiguration configuration,
        string[]? configuredOrigins,
        string configurationKey = "AllowedOrigins")
    {
        var origins = new List<string>();

        if (configuredOrigins is { Length: > 0 })
        {
            origins.AddRange(configuredOrigins);
        }

        // Render/env often sets values as one comma-separated string (not array indexes).
        var envOrigins = configuration[$"{CorsSettings.SectionName}:{configurationKey}"];
        if (!string.IsNullOrWhiteSpace(envOrigins))
        {
            origins.AddRange(envOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }

        return Normalize(origins);
    }

    /// <summary>
    /// Resolves production CORS origins. Uses fallback list when allowed origins are not configured.
    /// </summary>
    public static (string[] Origins, bool UsedFallback) ResolveForProduction(
        IConfiguration configuration,
        CorsSettings settings)
    {
        var allowed = Resolve(configuration, settings.AllowedOrigins);
        if (allowed.Length > 0)
        {
            return (allowed, UsedFallback: false);
        }

        var fallback = Resolve(configuration, settings.FallbackAllowedOrigins, "FallbackAllowedOrigins");
        return (fallback, UsedFallback: true);
    }

    private static string[] Normalize(IEnumerable<string> origins) =>
        origins
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Select(o => o.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
}
