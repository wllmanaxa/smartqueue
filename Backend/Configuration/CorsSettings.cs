namespace Backend.Configuration;

public class CorsSettings
{
    public const string SectionName = "Cors";

    /// <summary>Allowed browser origins (e.g. Vercel app URL). Comma-separated in env: Cors__AllowedOrigins.</summary>
    public string[] AllowedOrigins { get; set; } = [];
}
