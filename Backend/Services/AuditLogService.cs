using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Audit;
using Backend.DTOs.Common;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public AuditLogService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<AuditLogDto>>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(a =>
                a.EntityName.ToLower().Contains(s) ||
                a.Action.ToLower().Contains(s) ||
                (a.UserName != null && a.UserName.ToLower().Contains(s)));
        }

        q = q.OrderByDescending(a => a.CreatedAt);
        var page = await q.ProjectTo<AuditLogDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return ApiResponse<PagedResult<AuditLogDto>>.Ok(page);
    }
}
