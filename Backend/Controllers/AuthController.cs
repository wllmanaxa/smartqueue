using Asp.Versioning;
using Backend.DTOs.Auth;
using Backend.DTOs.Common;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[AllowAnonymous]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>Authenticate user and issue JWT + refresh token.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<TokenResponse>>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _auth.LoginAsync(request, ip, ct);
        return StatusCode(result.Success ? StatusCodes.Status200OK : StatusCodes.Status401Unauthorized, result);
    }

    /// <summary>Rotate refresh token.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<TokenResponse>>> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _auth.RefreshAsync(request, ip, ct);
        return StatusCode(result.Success ? StatusCodes.Status200OK : StatusCodes.Status401Unauthorized, result);
    }

    /// <summary>Register a user. Any role (e.g. admin, staff, customer) is allowed for dev/testing.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<DTOs.Users.UserDto>>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(request, ct);
        return StatusCode(result.Success ? StatusCodes.Status201Created : StatusCodes.Status400BadRequest, result);
    }
}
