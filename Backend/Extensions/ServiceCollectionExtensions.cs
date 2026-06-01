using Asp.Versioning;
using Backend.Configuration;
using Backend.Configurations;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.Helpers;
using Backend.Hubs;
using Backend.Interfaces;
using Backend.Middleware;
using Backend.Repositories;
using Backend.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;

namespace Backend.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<CorsSettings>(configuration.GetSection(CorsSettings.SectionName));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IBranchService, BranchService>();
        services.AddScoped<IQueueOfferingService, QueueOfferingService>();
        services.AddScoped<ICounterDeskService, CounterDeskService>();
        services.AddScoped<ITicketQueueService, TicketQueueService>();
        services.AddScoped<IQueueLogService, QueueLogService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IQueueRealtimeNotifier, QueueRealtimeNotifier>();

        services.AddAutoMapper(typeof(MappingProfile));
        services.AddValidatorsFromAssemblyContaining<MappingProfile>();
        services.AddFluentValidationAutoValidation();

        services.AddSignalR();

        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
        }).AddMvc();

        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Smart Queue Management API",
                Version = "v1",
                Description = "Enterprise queue backend"
            });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme.",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = JwtBearerDefaults.AuthenticationScheme,
                BearerFormat = "JWT"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });
            var xml = Path.Combine(AppContext.BaseDirectory, "Backend.xml");
            if (File.Exists(xml)) c.IncludeXmlComments(xml);
        });

        var jwt = configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
        ValidateJwtSettings(jwt, environment);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key));

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !environment.IsDevelopment();
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            context.Token = accessToken;
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", p => p.RequireRole(AppRoles.Admin));
            options.AddPolicy("StaffDesk", p => p.RequireRole(AppRoles.Admin, AppRoles.Staff, AppRoles.Receptionist));
        });

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy("fixed", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.User.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 200,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
        });

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                var body = ApiResponse<object>.Fail(string.Join("; ", errors));
                return new BadRequestObjectResult(body);
            };
        });

        var corsSettings = configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>() ?? new CorsSettings();

        services.AddCors(p => p.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials();

            if (environment.IsDevelopment())
            {
                var devOrigins = CorsOriginResolver.Resolve(configuration, corsSettings.AllowedOrigins);
                if (devOrigins.Length > 0)
                {
                    policy.WithOrigins(devOrigins);
                }
                else
                {
                    policy.SetIsOriginAllowed(_ => true);
                }
            }
            else
            {
                var (productionOrigins, _) = CorsOriginResolver.ResolveForProduction(configuration, corsSettings);
                var allowVercelPreviews = corsSettings.AllowVercelPreviews;

                policy.SetIsOriginAllowed(origin =>
                {
                    if (string.IsNullOrWhiteSpace(origin))
                    {
                        return false;
                    }

                    if (productionOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    if (!allowVercelPreviews || !Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return false;
                    }

                    return uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
                });
            }
        }));

        return services;
    }

    private static void ValidateJwtSettings(JwtSettings jwt, IWebHostEnvironment environment)
    {
        if (string.IsNullOrWhiteSpace(jwt.Issuer) || string.IsNullOrWhiteSpace(jwt.Audience))
        {
            throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be configured.");
        }

        if (environment.IsDevelopment())
        {
            if (string.IsNullOrWhiteSpace(jwt.Key))
            {
                throw new InvalidOperationException(
                    "Jwt:Key is not configured. Set Jwt__Key via environment variables or user secrets.");
            }

            return;
        }

        if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Key must be at least 32 characters in production. Set Jwt__Key via environment variables.");
        }

        if (jwt.Key.StartsWith("CHANGE_ME", StringComparison.OrdinalIgnoreCase) ||
            jwt.Key.StartsWith("REPLACE_WITH", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Jwt:Key must be replaced with a secure production secret.");
        }
    }
}
