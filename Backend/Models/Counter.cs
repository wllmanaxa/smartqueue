namespace Backend.Models;

public class Counter : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public Guid? StaffUserId { get; set; }
    public User? StaffUser { get; set; }

    public ICollection<QueueService> Services { get; set; } = new List<QueueService>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
