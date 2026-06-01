using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Backend.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _http;

    public CurrentUserService(IHttpContextAccessor http) => _http = http;

    public Guid? UserId
    {
        get
        {
            var sub = _http.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? _http.HttpContext?.User?.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? UserName => _http.HttpContext?.User?.Identity?.Name
                               ?? _http.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

    public IReadOnlyList<string> Roles =>
        _http.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList()
        ?? (IReadOnlyList<string>)Array.Empty<string>();
}
