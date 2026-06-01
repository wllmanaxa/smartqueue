namespace Backend.Configuration;

public class CorsSettings
{
    public const string SectionName = "Cors";

    /// <summary>Allowed browser origins (e.g. Vercel app URL). Comma-separated in env: Cors__AllowedOrigins.</summary>
    public string[] AllowedOrigins { get; set; } = [];

    /// <summary>
    /// Used in production only when <see cref="AllowedOrigins"/> is empty (temporary bootstrap before Vercel is live).
    /// Env: Cors__FallbackAllowedOrigins (comma-separated).
    /// </summary>
    public string[] FallbackAllowedOrigins { get; set; } =
    [
        "http://localhost:5173",
        "https://localhost:5173"
    ];

    /// <summary>
    /// When true, allows any origin whose host ends with <c>.vercel.app</c> (production/preview deploys).
    /// Env: Cors__AllowVercelPreviews (true/false).
    /// </summary>
    public bool AllowVercelPreviews { get; set; } = true;
}
