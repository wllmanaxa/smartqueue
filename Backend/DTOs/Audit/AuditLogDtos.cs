namespace Backend.DTOs.Audit;

public class AuditLogDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? UserName { get; set; }
    public Guid? UserId { get; set; }
    public string? IpAddress { get; set; }
}
