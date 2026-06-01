using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Queue;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class QueueLogService : IQueueLogService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    public QueueLogService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<QueueLogDto>>> GetPagedAsync(Guid? ticketId, SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.QueueLogs.AsNoTracking()
            .Include(l => l.Ticket)
            .Include(l => l.PerformedByUser)
            .Where(l => !l.IsDeleted);
        if (ticketId.HasValue) q = q.Where(l => l.TicketId == ticketId.Value);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(l => l.Ticket.TicketNumber.ToLower().Contains(s));
        }

        q = q.OrderByDescending(l => l.CreatedAt);
        var page = await q.ProjectTo<QueueLogDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return ApiResponse<PagedResult<QueueLogDto>>.Ok(page);
    }
}
