using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Notifications;
using Backend.Helpers;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IRepository<Notification> _notifications;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public NotificationService(ApplicationDbContext db, IRepository<Notification> notifications, IUnitOfWork uow, IMapper mapper)
    {
        _db = db;
        _notifications = notifications;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<NotificationDto>>> GetPagedAsync(Guid? userId, SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Notifications.AsNoTracking().Where(n => !n.IsDeleted);
        if (userId.HasValue) q = q.Where(n => n.UserId == userId.Value);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(n => n.Title.ToLower().Contains(s) || n.Message.ToLower().Contains(s));
        }

        q = q.OrderByDescending(n => n.CreatedAt);
        var page = await q.ProjectTo<NotificationDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return ApiResponse<PagedResult<NotificationDto>>.Ok(page);
    }

    public async Task<ApiResponse<NotificationDto>> CreateAsync(CreateNotificationRequest request, CancellationToken ct = default)
    {
        if (request.UserId.HasValue && !await _db.Users.AnyAsync(u => u.Id == request.UserId && !u.IsDeleted, ct))
            return ApiResponse<NotificationDto>.Fail("User not found");

        Enum.TryParse<NotificationType>(request.Type, true, out var type);

        var n = new Notification
        {
            UserId = request.UserId,
            TicketId = request.TicketId,
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            Type = type
        };
        await _notifications.AddAsync(n, ct);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<NotificationDto>.Ok(_mapper.Map<NotificationDto>(n));
    }

    public async Task<ApiResponse<bool>> MarkReadAsync(Guid id, CancellationToken ct = default)
    {
        var n = await _notifications.GetByIdAsync(id, ct);
        if (n == null) return ApiResponse<bool>.Fail("Notification not found");
        n.IsRead = true;
        _notifications.Update(n);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
