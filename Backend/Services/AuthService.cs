using AutoMapper;
using Backend.Data;
using Backend.DTOs.Auth;
using Backend.DTOs.Common;
using Backend.DTOs.Users;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        ApplicationDbContext db,
        IJwtTokenService jwt,
        IRefreshTokenRepository refreshTokens,
        IUnitOfWork uow,
        IMapper mapper,
        Microsoft.Extensions.Options.IOptions<JwtSettings> jwtOptions)
    {
        _db = db;
        _jwt = jwt;
        _refreshTokens = refreshTokens;
        _uow = uow;
        _mapper = mapper;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<ApiResponse<TokenResponse>> LoginAsync(LoginRequest request, string? ip, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName && !u.IsDeleted, ct);

        if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return ApiResponse<TokenResponse>.Fail("Invalid credentials");

        var roles = new[] { user.Role.Name };
        var access = _jwt.GenerateAccessToken(user, roles);
        var refresh = _jwt.GenerateRefreshToken();

        await _refreshTokens.AddAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refresh,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays),
            CreatedByIp = ip
        }, ct);

        await _uow.SaveChangesAsync(ct);

        return ApiResponse<TokenResponse>.Ok(new TokenResponse
        {
            AccessToken = access,
            RefreshToken = refresh,
            AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes),
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        });
    }

    public async Task<ApiResponse<TokenResponse>> RefreshAsync(RefreshTokenRequest request, string? ip, CancellationToken ct = default)
    {
        var existing = await _refreshTokens.GetByTokenAsync(request.RefreshToken, ct);
        if (existing == null || !existing.IsActive)
            return ApiResponse<TokenResponse>.Fail("Invalid refresh token");

        var user = existing.User;
        if (!user.IsActive || user.IsDeleted)
            return ApiResponse<TokenResponse>.Fail("User inactive");

        existing.RevokedAt = DateTime.UtcNow;
        existing.RevokedByIp = ip;

        var newRefresh = _jwt.GenerateRefreshToken();
        existing.ReplacedByToken = newRefresh;
        _refreshTokens.Update(existing);

        await _refreshTokens.AddAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = newRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays),
            CreatedByIp = ip
        }, ct);

        await _uow.SaveChangesAsync(ct);

        await _db.Entry(user).Reference(u => u.Role).LoadAsync(ct);
        var access = _jwt.GenerateAccessToken(user, new[] { user.Role.Name });

        return ApiResponse<TokenResponse>.Ok(new TokenResponse
        {
            AccessToken = access,
            RefreshToken = newRefresh,
            AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes),
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        });
    }

    public async Task<ApiResponse<UserDto>> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        // Dev/testing: any role (including Admin) may be requested without an authenticated admin caller.
        var roleName = request.RoleName.Trim();
        var role = await _db.Roles.FirstOrDefaultAsync(
            r => !r.IsDeleted && r.Name.ToLower() == roleName.ToLower(), ct);
        if (role == null)
            return ApiResponse<UserDto>.Fail("Role not found");

        if (await _db.Users.AnyAsync(u => u.UserName == request.UserName && !u.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Username already taken");

        if (await _db.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Email already taken");

        if (request.BranchId.HasValue &&
            !await _db.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Branch not found");

        var user = new User
        {
            UserName = request.UserName.Trim(),
            Email = request.Email.Trim(),
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = role.Id,
            BranchId = request.BranchId,
            IsActive = true
        };

        await _db.Users.AddAsync(user, ct);
        await _uow.SaveChangesAsync(ct);

        await _db.Entry(user).Reference(u => u.Role).LoadAsync(ct);
        if (user.BranchId.HasValue)
            await _db.Entry(user).Reference(u => u.Branch).LoadAsync(ct);

        return ApiResponse<UserDto>.Ok(_mapper.Map<UserDto>(user), "User registered");
    }
}
