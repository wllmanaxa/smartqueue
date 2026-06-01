using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Reports;
using Backend.Interfaces;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _db;

    public ReportService(ApplicationDbContext db) => _db = db;

    public async Task<ApiResponse<IReadOnlyList<DailyReportDto>>> DailyAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        from = DateTime.SpecifyKind(from.Date, DateTimeKind.Utc);
        to = DateTime.SpecifyKind(to.Date, DateTimeKind.Utc).AddDays(1).AddTicks(-1);

        var q = _db.Tickets.AsNoTracking().Where(t => !t.IsDeleted && t.CreatedAt >= from && t.CreatedAt <= to);
        if (branchId.HasValue) q = q.Where(t => t.BranchId == branchId.Value);

        var rows = await q
            .Select(t => new
            {
                Day = t.CreatedAt.Date,
                t.Status,
                WaitMinutes = t.CalledAt != null && t.Status == TicketStatus.Completed
                    ? (double?)(t.CalledAt!.Value - t.CreatedAt).TotalMinutes
                    : null
            })
            .ToListAsync(ct);

        var result = rows
            .GroupBy(x => x.Day)
            .Select(g => new DailyReportDto
            {
                Date = g.Key,
                TotalTickets = g.Count(),
                Completed = g.Count(x => x.Status == TicketStatus.Completed),
                Skipped = g.Count(x => x.Status == TicketStatus.Skipped),
                Cancelled = g.Count(x => x.Status == TicketStatus.Cancelled),
                AverageWaitMinutes = g.Where(x => x.WaitMinutes.HasValue).Select(x => x.WaitMinutes!.Value).DefaultIfEmpty(0).Average()
            })
            .OrderBy(r => r.Date)
            .ToList();

        return ApiResponse<IReadOnlyList<DailyReportDto>>.Ok(result);
    }

    public async Task<ApiResponse<IReadOnlyList<PeakHoursDto>>> PeakHoursAsync(Guid? branchId, DateTime day, CancellationToken ct = default)
    {
        var start = DateTime.SpecifyKind(day.Date, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var q = _db.Tickets.AsNoTracking().Where(t => !t.IsDeleted && t.CreatedAt >= start && t.CreatedAt < end);
        if (branchId.HasValue) q = q.Where(t => t.BranchId == branchId.Value);

        var rows = await q
            .GroupBy(t => t.CreatedAt.Hour)
            .Select(g => new PeakHoursDto { Hour = g.Key, TicketCount = g.Count() })
            .OrderBy(x => x.Hour)
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<PeakHoursDto>>.Ok(rows);
    }

    public async Task<ApiResponse<IReadOnlyList<StaffPerformanceDto>>> StaffPerformanceAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        from = DateTime.SpecifyKind(from, DateTimeKind.Utc);
        to = DateTime.SpecifyKind(to, DateTimeKind.Utc);

        var data = await _db.QueueLogs.AsNoTracking()
            .Where(log => !log.IsDeleted &&
                          log.PerformedByUserId != null &&
                          log.Action == QueueLogAction.Completed &&
                          log.CreatedAt >= from &&
                          log.CreatedAt <= to)
            .Join(_db.Users.AsNoTracking(),
                log => log.PerformedByUserId!.Value,
                u => u.Id,
                (log, u) => new { log, u })
            .Join(_db.Tickets.AsNoTracking(),
                x => x.log.TicketId,
                t => t.Id,
                (x, t) => new { x.log, x.u, t })
            .Where(x => !x.t.IsDeleted && (!branchId.HasValue || x.t.BranchId == branchId.Value))
            .Select(x => new { x.u.Id, x.u.UserName, x.t.ServedAt, x.t.CompletedAt })
            .ToListAsync(ct);

        var grouped = data
            .Where(x => x.ServedAt != null && x.CompletedAt != null)
            .GroupBy(x => new { x.Id, x.UserName })
            .Select(g => new StaffPerformanceDto
            {
                UserId = g.Key.Id,
                UserName = g.Key.UserName,
                TicketsServed = g.Count(),
                AverageServiceMinutes = g.Average(x => (x.CompletedAt!.Value - x.ServedAt!.Value).TotalMinutes)
            })
            .OrderByDescending(x => x.TicketsServed)
            .ToList();

        return ApiResponse<IReadOnlyList<StaffPerformanceDto>>.Ok(grouped);
    }

    public async Task<ApiResponse<QueueStatisticsDto>> QueueStatsAsync(Guid branchId, CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var q = _db.Tickets.AsNoTracking().Where(t => !t.IsDeleted && t.BranchId == branchId);

        var dto = new QueueStatisticsDto
        {
            Waiting = await q.CountAsync(t => t.Status == TicketStatus.Waiting, ct),
            Serving = await q.CountAsync(t => t.Status == TicketStatus.Serving, ct),
            CompletedToday = await q.CountAsync(t => t.Status == TicketStatus.Completed && t.CompletedAt >= today, ct),
            SkippedToday = await q.CountAsync(t => t.Status == TicketStatus.Skipped && t.CompletedAt >= today, ct)
        };

        return ApiResponse<QueueStatisticsDto>.Ok(dto);
    }

    public async Task<ApiResponse<IReadOnlyList<BranchStatisticsDto>>> BranchStatsAsync(CancellationToken ct = default)
    {
        var list = await _db.Branches.AsNoTracking()
            .Where(b => !b.IsDeleted)
            .Select(b => new BranchStatisticsDto
            {
                BranchId = b.Id,
                BranchName = b.Name,
                ActiveTickets = b.Tickets.Count(t => !t.IsDeleted && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Serving)),
                Counters = b.Counters.Count(c => !c.IsDeleted),
                Services = b.Services.Count(s => !s.IsDeleted)
            })
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<BranchStatisticsDto>>.Ok(list);
    }
}
