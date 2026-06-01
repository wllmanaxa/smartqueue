namespace Backend.Models;

public class Ticket : BaseEntity
{
    public string TicketNumber { get; set; } = string.Empty;
    public TicketStatus Status { get; set; } = TicketStatus.Waiting;
    public TicketPriority Priority { get; set; } = TicketPriority.Normal;
    public string? QrPayload { get; set; }
    public string? QrImageBase64 { get; set; }
    public DateTime? CalledAt { get; set; }
    public DateTime? ServedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int SortOrder { get; set; }

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public Guid ServiceId { get; set; }
    public QueueService Service { get; set; } = null!;

    public Guid? CounterId { get; set; }
    public Counter? Counter { get; set; }

    public Guid? CustomerUserId { get; set; }
    public User? CustomerUser { get; set; }

    public ICollection<QueueLog> QueueLogs { get; set; } = new List<QueueLog>();
}
