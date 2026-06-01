using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Roles;
using Backend.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class RolesController : ApiControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public RolesController(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<RoleDto>>>> GetPage([FromQuery] SearchQuery query, CancellationToken ct)
    {
        var q = _db.Roles.AsNoTracking().Where(r => !r.IsDeleted).OrderBy(r => r.Name);
        var page = await q.ProjectTo<RoleDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return Ok(ApiResponse<PagedResult<RoleDto>>.Ok(page));
    }
}
