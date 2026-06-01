using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Queue;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize(Policy = "StaffDesk")]
public class QueueLogsController : ApiControllerBase
{
    private readonly IQueueLogService _logs;

    public QueueLogsController(IQueueLogService logs) => _logs = logs;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<QueueLogDto>>>> GetPage(
        [FromQuery] Guid? ticketId,
        [FromQuery] SearchQuery query,
        CancellationToken ct) =>
        Ok(await _logs.GetPagedAsync(ticketId, query, ct));
}
