using Asp.Versioning;
using Backend.DTOs.Audit;
using Backend.DTOs.Common;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class AuditLogsController : ApiControllerBase
{
    private readonly IAuditLogService _audit;

    public AuditLogsController(IAuditLogService audit) => _audit = audit;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditLogDto>>>> GetPage([FromQuery] SearchQuery query, CancellationToken ct) =>
        Ok(await _audit.GetPagedAsync(query, ct));
}
