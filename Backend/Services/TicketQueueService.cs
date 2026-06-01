using System.Text.Json;
using AutoMapper;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Tickets;
using Backend.Helpers;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Services;

public class TicketQueueService : ITicketQueueService
{
    private readonly ApplicationDbContext _db;
    private readonly IRepository<Ticket> _tickets;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IQueueRealtimeNotifier _realtime;
    private readonly ICurrentUserService _current;
    private readonly ILogger<TicketQueueService> _logger;

    public TicketQueueService(
        ApplicationDbContext db,
        IRepository<Ticket> tickets,
        IUnitOfWork uow,
        IMapper mapper,
        IQueueRealtimeNotifier realtime,
        ICurrentUserService current,
        ILogger<TicketQueueService> logger)
    {
        _db = db;
        _tickets = tickets;
        _uow = uow;
        _mapper = mapper;
        _realtime = realtime;
        _current = current;
        _logger = logger;
    }

    public async Task<ApiResponse<PagedResult<TicketDto>>> GetPagedAsync(
        Guid? branchId,
        Guid? serviceId,
        string? status,
        SearchQuery query,
        CancellationToken ct = default)
    {
        var q = _db.Tickets.AsNoTracking()
            .Include(t => t.Branch)
            .Include(t => t.Service)
            .Include(t => t.Counter)
            .Where(t => !t.IsDeleted);

        if (branchId.HasValue) q = q.Where(t => t.BranchId == branchId.Value);
        if (serviceId.HasValue) q = q.Where(t => t.ServiceId == serviceId.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TicketStatus>(status, true, out var st))
            q = q.Where(t => t.Status == st);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(t => t.TicketNumber.ToLower().Contains(s));
        }

        q = q.OrderByDescending(t => t.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var dtos = new List<TicketDto>();
        foreach (var t in items)
        {
            var dto = _mapper.Map<TicketDto>(t);
            dto.EstimatedWaitMinutes = await GetEstimatedWaitMinutesAsync(t, ct);
            dtos.Add(dto);
        }

        var page = new PagedResult<TicketDto>
        {
            Items = dtos,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = total
        };
        return ApiResponse<PagedResult<TicketDto>>.Ok(page);
    }

    public async Task<ApiResponse<TicketDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Tickets.AsNoTracking()
            .Include(x => x.Branch)
            .Include(x => x.Service)
            .Include(x => x.Counter)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (t == null) return ApiResponse<TicketDto>.Fail("Ticket not found");
        var dto = _mapper.Map<TicketDto>(t);
        dto.EstimatedWaitMinutes = await GetEstimatedWaitMinutesAsync(t, ct);
        return ApiResponse<TicketDto>.Ok(dto);
    }

    public async Task<ApiResponse<TicketDto>> CreateAsync(CreateTicketRequest request, CancellationToken ct = default)
    {
        try
        {
            if (request.BranchId == Guid.Empty)
                return ApiResponse<TicketDto>.Fail("Branch is required");
            if (request.ServiceId == Guid.Empty)
                return ApiResponse<TicketDto>.Fail("Service is required");

            var branch = await _db.Branches.AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == request.BranchId && !b.IsDeleted, ct);
            if (branch == null)
                return ApiResponse<TicketDto>.Fail("Branch not found");
            if (!branch.IsActive)
                return ApiResponse<TicketDto>.Fail("Branch is not active");

            var service = await _db.Services.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.BranchId == request.BranchId && !s.IsDeleted, ct);
            if (service == null)
                return ApiResponse<TicketDto>.Fail("Service not found");
            if (!service.IsActive)
                return ApiResponse<TicketDto>.Fail("Service is not active");

            if (request.CustomerUserId.HasValue)
            {
                if (request.CustomerUserId.Value == Guid.Empty)
                    return ApiResponse<TicketDto>.Fail("Customer user is invalid");
                if (!await _db.Users.AnyAsync(u => u.Id == request.CustomerUserId && !u.IsDeleted, ct))
                    return ApiResponse<TicketDto>.Fail("Customer user not found");
            }

            var performedByUserId = await ResolvePerformedByUserIdAsync(ct);
            var priority = ParsePriority(request.Priority);
            var ticketNumber = await GenerateTicketNumberAsync(request.BranchId, branch.Code, ct);
            var maxOrder = await _db.Tickets
                .Where(t => t.BranchId == request.BranchId && t.ServiceId == request.ServiceId && !t.IsDeleted)
                .MaxAsync(t => (int?)t.SortOrder, ct) ?? 0;

            var ticket = new Ticket
            {
                BranchId = request.BranchId,
                ServiceId = request.ServiceId,
                TicketNumber = ticketNumber,
                Status = TicketStatus.Waiting,
                Priority = priority,
                CustomerUserId = request.CustomerUserId,
                SortOrder = maxOrder + 1
            };
            ticket.QrPayload = JsonSerializer.Serialize(new { ticket.Id, ticket.TicketNumber });

            try
            {
                ticket.QrImageBase64 = QrHelper.GeneratePngDataUrl(ticket.TicketNumber);
            }
            catch (Exception qrEx)
            {
                _logger.LogWarning(qrEx, "QR code generation failed for ticket {TicketNumber}", ticket.TicketNumber);
            }

            await _db.Tickets.AddAsync(ticket, ct);
            await _db.QueueLogs.AddAsync(new QueueLog
            {
                TicketId = ticket.Id,
                Action = QueueLogAction.Created,
                PerformedByUserId = performedByUserId
            }, ct);

            await _uow.SaveChangesAsync(ct);

            await _db.Entry(ticket).Reference(x => x.Branch).LoadAsync(ct);
            await _db.Entry(ticket).Reference(x => x.Service).LoadAsync(ct);

            var dto = _mapper.Map<TicketDto>(ticket);
            dto.EstimatedWaitMinutes = await GetEstimatedWaitMinutesAsync(ticket, ct);

            try
            {
                await _realtime.NotifyBranchAsync(ticket.BranchId, "queueUpdated", new { ticket.Id, ticket.Status }, ct);
            }
            catch (Exception notifyEx)
            {
                _logger.LogWarning(notifyEx, "Realtime notification failed after creating ticket {TicketId}", ticket.Id);
            }

            return ApiResponse<TicketDto>.Ok(dto, "Ticket created");
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating ticket. Message: {Message}", ex.Message);
            return ApiResponse<TicketDto>.Fail(DatabaseExceptionHelper.ToUserMessage(ex));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating ticket. Message: {Message}", ex.Message);
            return ApiResponse<TicketDto>.Fail("Unable to create ticket. Please try again.");
        }
    }

    public async Task<ApiResponse<TicketDto>> CallNextAsync(Guid ticketId, CallTicketRequest request, CancellationToken ct = default)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Service)
            .Include(t => t.Branch)
            .Include(t => t.Counter)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, ct);
        if (ticket == null) return ApiResponse<TicketDto>.Fail("Ticket not found");
        if (ticket.Status != TicketStatus.Waiting)
            return ApiResponse<TicketDto>.Fail("Ticket is not waiting");

        var counter = await _db.Counters
            .Include(c => c.Services)
            .FirstOrDefaultAsync(c => c.Id == request.CounterId && !c.IsDeleted, ct);
        if (counter == null) return ApiResponse<TicketDto>.Fail("Counter not found");
        if (counter.BranchId != ticket.BranchId) return ApiResponse<TicketDto>.Fail("Counter does not belong to ticket branch");
        if (!counter.Services.Any(s => s.Id == ticket.ServiceId))
            return ApiResponse<TicketDto>.Fail("Counter is not configured for this service");

        ticket.Status = TicketStatus.Serving;
        ticket.CounterId = counter.Id;
        ticket.CalledAt = DateTime.UtcNow;
        ticket.ServedAt = DateTime.UtcNow;

        await _db.QueueLogs.AddAsync(new QueueLog
        {
            TicketId = ticket.Id,
            Action = QueueLogAction.Called,
            Notes = $"Counter {counter.Number}",
            PerformedByUserId = await ResolvePerformedByUserIdAsync(ct)
        }, ct);

        _tickets.Update(ticket);
        await _uow.SaveChangesAsync(ct);

        var dto = _mapper.Map<TicketDto>(ticket);
        dto.EstimatedWaitMinutes = 0;
        await _realtime.NotifyBranchAsync(ticket.BranchId, "queueUpdated", new { ticketId = ticket.Id, ticket.Status, counterId = counter.Id }, ct);
        return ApiResponse<TicketDto>.Ok(dto, "Ticket called");
    }

    public async Task<ApiResponse<TicketDto>> CompleteAsync(Guid ticketId, CompleteTicketRequest? request, CancellationToken ct = default)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Service)
            .Include(t => t.Branch)
            .Include(t => t.Counter)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, ct);
        if (ticket == null) return ApiResponse<TicketDto>.Fail("Ticket not found");
        if (ticket.Status != TicketStatus.Serving)
            return ApiResponse<TicketDto>.Fail("Ticket is not being served");

        ticket.Status = TicketStatus.Completed;
        ticket.CompletedAt = DateTime.UtcNow;

        await _db.QueueLogs.AddAsync(new QueueLog
        {
            TicketId = ticket.Id,
            Action = QueueLogAction.Completed,
            Notes = request?.Notes,
            PerformedByUserId = await ResolvePerformedByUserIdAsync(ct)
        }, ct);

        _tickets.Update(ticket);
        await _uow.SaveChangesAsync(ct);

        var dto = _mapper.Map<TicketDto>(ticket);
        await _realtime.NotifyBranchAsync(ticket.BranchId, "queueUpdated", new { ticket.Id, ticket.Status }, ct);
        return ApiResponse<TicketDto>.Ok(dto, "Ticket completed");
    }

    public async Task<ApiResponse<TicketDto>> SkipAsync(Guid ticketId, SkipTicketRequest? request, CancellationToken ct = default)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Service)
            .Include(t => t.Branch)
            .Include(t => t.Counter)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, ct);
        if (ticket == null) return ApiResponse<TicketDto>.Fail("Ticket not found");
        if (ticket.Status is not (TicketStatus.Waiting or TicketStatus.Serving))
            return ApiResponse<TicketDto>.Fail("Ticket cannot be skipped in current state");

        ticket.Status = TicketStatus.Skipped;
        ticket.CompletedAt = DateTime.UtcNow;

        await _db.QueueLogs.AddAsync(new QueueLog
        {
            TicketId = ticket.Id,
            Action = QueueLogAction.Skipped,
            Notes = request?.Notes,
            PerformedByUserId = await ResolvePerformedByUserIdAsync(ct)
        }, ct);

        _tickets.Update(ticket);
        await _uow.SaveChangesAsync(ct);

        var dto = _mapper.Map<TicketDto>(ticket);
        await _realtime.NotifyBranchAsync(ticket.BranchId, "queueUpdated", new { ticket.Id, ticket.Status }, ct);
        return ApiResponse<TicketDto>.Ok(dto, "Ticket skipped");
    }

    public async Task<ApiResponse<TicketDto>> CancelAsync(Guid ticketId, CancellationToken ct = default)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Service)
            .Include(t => t.Branch)
            .Include(t => t.Counter)
            .FirstOrDefaultAsync(t => t.Id == ticketId && !t.IsDeleted, ct);
        if (ticket == null) return ApiResponse<TicketDto>.Fail("Ticket not found");
        if (ticket.Status is TicketStatus.Completed or TicketStatus.Cancelled)
            return ApiResponse<TicketDto>.Fail("Ticket cannot be cancelled");

        ticket.Status = TicketStatus.Cancelled;
        ticket.CompletedAt = DateTime.UtcNow;

        await _db.QueueLogs.AddAsync(new QueueLog
        {
            TicketId = ticket.Id,
            Action = QueueLogAction.Cancelled,
            PerformedByUserId = await ResolvePerformedByUserIdAsync(ct)
        }, ct);

        _tickets.Update(ticket);
        await _uow.SaveChangesAsync(ct);

        var dto = _mapper.Map<TicketDto>(ticket);
        await _realtime.NotifyBranchAsync(ticket.BranchId, "queueUpdated", new { ticket.Id, ticket.Status }, ct);
        return ApiResponse<TicketDto>.Ok(dto, "Ticket cancelled");
    }

    private async Task<Guid?> ResolvePerformedByUserIdAsync(CancellationToken ct)
    {
        var userId = _current.UserId;
        if (!userId.HasValue || userId.Value == Guid.Empty)
            return null;

        var exists = await _db.Users.AsNoTracking()
            .AnyAsync(u => u.Id == userId.Value && !u.IsDeleted, ct);
        if (!exists)
        {
            _logger.LogWarning("Authenticated user {UserId} was not found in the database; queue log will have no performer.", userId);
            return null;
        }

        return userId;
    }

    private static TicketPriority ParsePriority(string? p)
    {
        if (string.IsNullOrWhiteSpace(p)) return TicketPriority.Normal;
        if (string.Equals(p, "VIP", StringComparison.OrdinalIgnoreCase)) return TicketPriority.Vip;
        return Enum.TryParse<TicketPriority>(p, true, out var pr) ? pr : TicketPriority.Normal;
    }

    private async Task<string> GenerateTicketNumberAsync(Guid branchId, string branchCode, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var prefix = $"{branchCode}-{today:yyyyMMdd}-";
        var last = await _db.Tickets
            .Where(t => t.BranchId == branchId && t.TicketNumber.StartsWith(prefix) && !t.IsDeleted)
            .OrderByDescending(t => t.TicketNumber)
            .Select(t => t.TicketNumber)
            .FirstOrDefaultAsync(ct);

        var next = 1;
        if (last != null)
        {
            var parts = last.Split('-', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0 && int.TryParse(parts[^1], out var n))
                next = n + 1;
        }

        return $"{prefix}{next:D4}";
    }

    private async Task<int> GetEstimatedWaitMinutesAsync(Ticket ticket, CancellationToken ct)
    {
        if (ticket.Status != TicketStatus.Waiting) return 0;

        var orderedIds = await _db.Tickets.AsNoTracking()
            .Where(t => t.BranchId == ticket.BranchId &&
                        t.ServiceId == ticket.ServiceId &&
                        t.Status == TicketStatus.Waiting &&
                        !t.IsDeleted)
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.SortOrder)
            .ThenBy(t => t.CreatedAt)
            .Select(t => t.Id)
            .ToListAsync(ct);

        var index = orderedIds.IndexOf(ticket.Id);
        if (index < 0) return 0;

        var avg = ticket.Service?.AverageHandlingMinutes ?? 10;
        return index * avg;
    }
}
