namespace Backend.DTOs.Counters;

public class CounterDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid BranchId { get; set; }
    public string? BranchName { get; set; }
    public Guid? StaffUserId { get; set; }
    public string? StaffUserName { get; set; }
    public IReadOnlyList<Guid> ServiceIds { get; set; } = Array.Empty<Guid>();
}

public class CreateCounterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public Guid? StaffUserId { get; set; }
    public bool IsActive { get; set; } = true;
    public List<Guid> ServiceIds { get; set; } = new();
}

public class UpdateCounterRequest
{
    public string? Name { get; set; }
    public string? Number { get; set; }
    public Guid? StaffUserId { get; set; }
    public bool? IsActive { get; set; }
    public List<Guid>? ServiceIds { get; set; }
}
