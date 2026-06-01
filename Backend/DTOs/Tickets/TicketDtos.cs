namespace Backend.DTOs.Tickets;

public class TicketDto
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? QrPayload { get; set; }
    public string? QrImageBase64 { get; set; }
    public DateTime? CalledAt { get; set; }
    public DateTime? ServedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int EstimatedWaitMinutes { get; set; }
    public Guid BranchId { get; set; }
    public string? BranchName { get; set; }
    public Guid ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public Guid? CounterId { get; set; }
    public string? CounterName { get; set; }
    public Guid? CustomerUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTicketRequest
{
    public Guid BranchId { get; set; }
    public Guid ServiceId { get; set; }
    public string Priority { get; set; } = "Normal";
    public Guid? CustomerUserId { get; set; }
}

public class CallTicketRequest
{
    public Guid CounterId { get; set; }
}

public class CompleteTicketRequest
{
    public string? Notes { get; set; }
}

public class SkipTicketRequest
{
    public string? Notes { get; set; }
}
