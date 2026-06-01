namespace Backend.Models;

public class QueueLog : BaseEntity
{
    public QueueLogAction Action { get; set; }
    public string? Notes { get; set; }

    public Guid TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    public Guid? PerformedByUserId { get; set; }
    public User? PerformedByUser { get; set; }
}
