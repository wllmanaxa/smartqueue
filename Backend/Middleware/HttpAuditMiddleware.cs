using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Middleware;

/// <summary>
/// Persists lightweight HTTP audit entries for mutating API calls.
/// </summary>
public class HttpAuditMiddleware
{
    private readonly RequestDelegate _next;

    public HttpAuditMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(
        HttpContext context,
        IAuditLogRepository auditLogs,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        await _next(context);

        if (context.Response.StatusCode >= 400) return;
        if (!context.Request.Path.StartsWithSegments("/api")) return;

        var method = context.Request.Method;
        if (method is not ("POST" or "PUT" or "PATCH" or "DELETE")) return;

        var entry = new AuditLog
        {
            Action = method,
            EntityName = "HttpRequest",
            NewValues = context.Request.Path + context.Request.QueryString,
            UserName = currentUser.UserName,
            UserId = currentUser.UserId,
            IpAddress = context.Connection.RemoteIpAddress?.ToString()
        };

        await auditLogs.AddAsync(entry, context.RequestAborted);
        await unitOfWork.SaveChangesAsync(context.RequestAborted);
    }
}
