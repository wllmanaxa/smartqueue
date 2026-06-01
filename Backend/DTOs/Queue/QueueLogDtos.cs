namespace Backend.DTOs.Queue;

public class QueueLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public Guid TicketId { get; set; }
    public string? TicketNumber { get; set; }
    public Guid? PerformedByUserId { get; set; }
    public string? PerformedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
