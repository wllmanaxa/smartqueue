using System.Net;
using System.Text.Json;
using Backend.DTOs.Common;
using Backend.Helpers;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await WriteAsync(context, (int)HttpStatusCode.BadRequest,
                ApiResponse<object>.Fail(string.Join("; ", ex.Errors.Select(e => e.ErrorMessage))));
        }
        catch (KeyNotFoundException ex)
        {
            await WriteAsync(context, (int)HttpStatusCode.NotFound, ApiResponse<object>.Fail(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteAsync(context, (int)HttpStatusCode.Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database update failed. Message: {Message}", ex.Message);
            await WriteAsync(context, (int)HttpStatusCode.BadRequest,
                ApiResponse<object>.Fail(DatabaseExceptionHelper.ToUserMessage(ex)));
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unhandled exception on {Method} {Path}. Message: {Message}",
                context.Request.Method,
                context.Request.Path,
                ex.Message);
            await WriteAsync(context, (int)HttpStatusCode.InternalServerError,
                ApiResponse<object>.Fail("An unexpected error occurred."));
        }
    }

    private static async Task WriteAsync(HttpContext context, int statusCode, ApiResponse<object> body)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsync(JsonSerializer.Serialize(body,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
