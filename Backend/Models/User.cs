namespace Backend.Models;

public class User : BaseEntity
{
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    /// <summary>Assigned branch for staff/receptionist; optional for admin/customer.</summary>
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Counter> Counters { get; set; } = new List<Counter>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
