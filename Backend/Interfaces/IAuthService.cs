using Backend.DTOs.Auth;
using Backend.DTOs.Common;
using Backend.DTOs.Users;

namespace Backend.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<TokenResponse>> LoginAsync(LoginRequest request, string? ip, CancellationToken ct = default);
    Task<ApiResponse<TokenResponse>> RefreshAsync(RefreshTokenRequest request, string? ip, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
}
