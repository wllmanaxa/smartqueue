using System.Text.Json;
using Backend.Data;
using Backend.Extensions;
using Backend.Middleware;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Render requires binding to 0.0.0.0 on PORT (default 10000). Kestrel serves HTTP only; TLS ends at Render.
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is not configured. " +
        "Set ConnectionStrings__DefaultConnection (Neon PostgreSQL).");
}

// Cloud/reverse-proxy: trust X-Forwarded-* from the load balancer when enabled (see render.yaml).
var trustForwardedHeaders = builder.Environment.IsDevelopment() ||
    string.Equals(
        Environment.GetEnvironmentVariable("ASPNETCORE_FORWARDEDHEADERS_ENABLED"),
        "true",
        StringComparison.OrdinalIgnoreCase);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost;

    if (trustForwardedHeaders)
    {
        // Required for Render/Azure-style proxies; pair with ASPNETCORE_FORWARDEDHEADERS_ENABLED in production.
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    }
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(maxRetryCount: 3);
        npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.GetName().Name);
    }));

builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database", tags: ["ready", "db"]);

builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);

var app = builder.Build();

// Must run first so Request.Scheme reflects X-Forwarded-Proto from Render.
app.UseForwardedHeaders();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseHttpsRedirection();
}
else
{
    // Do not call UseHttpsRedirection or UseHsts here: Render terminates TLS and forwards HTTP to Kestrel.
    // UseHttpsRedirection with only an HTTP listener causes invalid redirects (often to https://host:8080) and
    // ERR_CONNECTION_RESET in the browser. See:
    // https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer
}

app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseMiddleware<HttpAuditMiddleware>();

var enableSwagger = app.Configuration.GetValue("Features:EnableSwagger", app.Environment.IsDevelopment());
if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Smart Queue API v1");
        options.RoutePrefix = "swagger";
    });
}

app.MapControllers();
app.MapHub<Backend.Hubs.QueueHub>("/hubs/queue");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = WriteHealthResponseAsync
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        await db.Database.MigrateAsync();
        await DataSeeder.SeedAsync(db);
        logger.LogInformation("Database migrations and seed completed.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration or seed failed.");
        throw;
    }
}

app.Logger.LogInformation(
    "Smart Queue API starting. Environment={Environment} Port={Port} TrustForwardedHeaders={TrustForwardedHeaders}",
    app.Environment.EnvironmentName,
    port,
    trustForwardedHeaders);

await app.RunAsync();

static Task WriteHealthResponseAsync(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";
    var payload = new
    {
        status = report.Status == HealthStatus.Healthy ? "healthy" : "unhealthy",
        totalDuration = report.TotalDuration.TotalMilliseconds,
        checks = report.Entries.ToDictionary(
            e => e.Key,
            e => new
            {
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds
            })
    };
    context.Response.StatusCode = report.Status == HealthStatus.Healthy
        ? StatusCodes.Status200OK
        : StatusCodes.Status503ServiceUnavailable;
    return context.Response.WriteAsync(JsonSerializer.Serialize(payload,
        new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
}
