using Asp.Versioning;
using Backend.DTOs.Branches;
using Backend.DTOs.Common;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
public class BranchesController : ApiControllerBase
{
    private readonly IBranchService _branches;

    public BranchesController(IBranchService branches) => _branches = branches;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BranchDto>>>> GetPage([FromQuery] SearchQuery query, CancellationToken ct) =>
        Ok(await _branches.GetPagedAsync(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> GetById(Guid id, CancellationToken ct)
    {
        var r = await _branches.GetByIdAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<BranchDto>>> Create([FromBody] CreateBranchRequest request, CancellationToken ct)
    {
        var r = await _branches.CreateAsync(request, ct);
        return r.Success ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r) : BadRequest(r);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<BranchDto>>> Update(Guid id, [FromBody] UpdateBranchRequest request, CancellationToken ct)
    {
        var r = await _branches.UpdateAsync(id, request, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        var r = await _branches.SoftDeleteAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }
}
