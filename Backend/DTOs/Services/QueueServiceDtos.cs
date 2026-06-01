namespace Backend.DTOs.Services;

public class QueueServiceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    public int AverageHandlingMinutes { get; set; }
    public bool IsActive { get; set; }
    public Guid BranchId { get; set; }
    public string? BranchName { get; set; }
}

public class CreateQueueServiceRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    public int AverageHandlingMinutes { get; set; } = 10;
    public Guid BranchId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateQueueServiceRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Code { get; set; }
    public int? AverageHandlingMinutes { get; set; }
    public bool? IsActive { get; set; }
}
