using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Users;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize(Roles = $"{AppRoles.Admin}")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users) => _users = users;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<UserDto>>>> GetPage([FromQuery] SearchQuery query, CancellationToken ct) =>
        Ok(await _users.GetPagedAsync(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetById(Guid id, CancellationToken ct)
    {
        var r = await _users.GetByIdAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var r = await _users.CreateAsync(request, ct);
        return r.Success ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r) : BadRequest(r);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var r = await _users.UpdateAsync(id, request, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct)
    {
        var r = await _users.SoftDeleteAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost("{id:guid}/change-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePassword(Guid id, [FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var r = await _users.ChangePasswordAsync(id, request, ct);
        return r.Success ? Ok(r) : BadRequest(r);
    }
}
