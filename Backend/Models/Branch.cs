namespace Backend.Models;

public class Branch : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? TimeZone { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<QueueService> Services { get; set; } = new List<QueueService>();
    public ICollection<Counter> Counters { get; set; } = new List<Counter>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
