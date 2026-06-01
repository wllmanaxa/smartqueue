namespace Backend.Models;

public class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public bool IsRead { get; set; }

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public Guid? TicketId { get; set; }
    public Ticket? Ticket { get; set; }
}
