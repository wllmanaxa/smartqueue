namespace Backend.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(Models.User user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    System.Security.Claims.ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
