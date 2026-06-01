using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Counters;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize(Policy = "StaffDesk")]
public class CountersController : ApiControllerBase
{
    private readonly ICounterDeskService _counters;

    public CountersController(ICounterDeskService counters) => _counters = counters;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CounterDto>>>> GetPage(
        [FromQuery] Guid? branchId,
        [FromQuery] Guid? serviceId,
        [FromQuery] bool? activeOnly,
        [FromQuery] SearchQuery query,
        CancellationToken ct) =>
        Ok(await _counters.GetPagedAsync(branchId, serviceId, activeOnly, query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CounterDto>>> GetById(Guid id, CancellationToken ct)
    {
        var r = await _counters.GetByIdAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<CounterDto>>> Create([FromBody] CreateCounterRequest request, CancellationToken ct)
    {
        var r = await _counters.CreateAsync(request, ct);
        return r.Success ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r) : BadRequest(r);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<CounterDto>>> Update(Guid id, [FromBody] UpdateCounterRequest request, CancellationToken ct)
    {
        var r = await _counters.UpdateAsync(id, request, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        var r = await _counters.SoftDeleteAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }
}
