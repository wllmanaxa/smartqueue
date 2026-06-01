namespace Backend.Models;

/// <summary>
/// A service offering at a branch (maps to table "Services").
/// </summary>
public class QueueService : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    /// <summary>Average handling time in minutes for ETA calculations.</summary>
    public int AverageHandlingMinutes { get; set; } = 10;
    public bool IsActive { get; set; } = true;

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<Counter> Counters { get; set; } = new List<Counter>();
}
