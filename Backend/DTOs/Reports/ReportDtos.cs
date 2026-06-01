namespace Backend.DTOs.Reports;

public class DailyReportDto
{
    public DateTime Date { get; set; }
    public int TotalTickets { get; set; }
    public int Completed { get; set; }
    public int Skipped { get; set; }
    public int Cancelled { get; set; }
    public double AverageWaitMinutes { get; set; }
}

public class PeakHoursDto
{
    public int Hour { get; set; }
    public int TicketCount { get; set; }
}

public class StaffPerformanceDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int TicketsServed { get; set; }
    public double AverageServiceMinutes { get; set; }
}

public class QueueStatisticsDto
{
    public int Waiting { get; set; }
    public int Serving { get; set; }
    public int CompletedToday { get; set; }
    public int SkippedToday { get; set; }
}

public class BranchStatisticsDto
{
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public int ActiveTickets { get; set; }
    public int Counters { get; set; }
    public int Services { get; set; }
}
