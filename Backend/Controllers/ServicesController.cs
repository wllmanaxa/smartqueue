using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Services;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
public class ServicesController : ApiControllerBase
{
    private readonly IQueueOfferingService _services;

    public ServicesController(IQueueOfferingService services) => _services = services;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<QueueServiceDto>>>> GetPage(
        [FromQuery] Guid? branchId,
        [FromQuery] SearchQuery query,
        CancellationToken ct) =>
        Ok(await _services.GetPagedAsync(branchId, query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<QueueServiceDto>>> GetById(Guid id, CancellationToken ct)
    {
        var r = await _services.GetByIdAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<QueueServiceDto>>> Create([FromBody] CreateQueueServiceRequest request, CancellationToken ct)
    {
        var r = await _services.CreateAsync(request, ct);
        return r.Success ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r) : BadRequest(r);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<QueueServiceDto>>> Update(Guid id, [FromBody] UpdateQueueServiceRequest request, CancellationToken ct)
    {
        var r = await _services.UpdateAsync(id, request, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        var r = await _services.SoftDeleteAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }
}
