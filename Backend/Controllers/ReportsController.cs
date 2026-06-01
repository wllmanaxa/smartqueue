using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Reports;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize(Policy = "StaffDesk")]
public class ReportsController : ApiControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports) => _reports = reports;

    [HttpGet("daily")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailyReportDto>>>> Daily(
        [FromQuery] Guid? branchId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        if (from == default) from = DateTime.UtcNow.Date.AddDays(-7);
        if (to == default) to = DateTime.UtcNow.Date;
        return Ok(await _reports.DailyAsync(branchId, from, to, ct));
    }

    [HttpGet("peak-hours")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PeakHoursDto>>>> PeakHours(
        [FromQuery] Guid? branchId,
        [FromQuery] DateTime? day,
        CancellationToken ct) =>
        Ok(await _reports.PeakHoursAsync(branchId, day ?? DateTime.UtcNow.Date, ct));

    [HttpGet("staff-performance")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StaffPerformanceDto>>>> StaffPerformance(
        [FromQuery] Guid? branchId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        if (from == default) from = DateTime.UtcNow.Date.AddDays(-30);
        if (to == default) to = DateTime.UtcNow;
        return Ok(await _reports.StaffPerformanceAsync(branchId, from, to, ct));
    }

    [HttpGet("queue-stats/{branchId:guid}")]
    public async Task<ActionResult<ApiResponse<QueueStatisticsDto>>> QueueStats(Guid branchId, CancellationToken ct) =>
        Ok(await _reports.QueueStatsAsync(branchId, ct));

    [HttpGet("branch-stats")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BranchStatisticsDto>>>> BranchStats(CancellationToken ct) =>
        Ok(await _reports.BranchStatsAsync(ct));
}
