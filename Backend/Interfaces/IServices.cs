using Backend.DTOs.Branches;
using Backend.DTOs.Common;
using Backend.DTOs.Services;
using Backend.DTOs.Counters;
using Backend.DTOs.Users;
using Backend.DTOs.Tickets;
using Backend.DTOs.Queue;
using Backend.DTOs.Notifications;
using Backend.DTOs.Audit;
using Backend.DTOs.Reports;

namespace Backend.Interfaces;

public interface IUserService
{
    Task<ApiResponse<PagedResult<UserDto>>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<bool>> ChangePasswordAsync(Guid id, ChangePasswordRequest request, CancellationToken ct = default);
}

public interface IBranchService
{
    Task<ApiResponse<PagedResult<BranchDto>>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
    Task<ApiResponse<BranchDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<BranchDto>> CreateAsync(CreateBranchRequest request, CancellationToken ct = default);
    Task<ApiResponse<BranchDto>> UpdateAsync(Guid id, UpdateBranchRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IQueueOfferingService
{
    Task<ApiResponse<PagedResult<QueueServiceDto>>> GetPagedAsync(Guid? branchId, SearchQuery query, CancellationToken ct = default);
    Task<ApiResponse<QueueServiceDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<QueueServiceDto>> CreateAsync(CreateQueueServiceRequest request, CancellationToken ct = default);
    Task<ApiResponse<QueueServiceDto>> UpdateAsync(Guid id, UpdateQueueServiceRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default);
}

public interface ICounterDeskService
{
    Task<ApiResponse<PagedResult<CounterDto>>> GetPagedAsync(
        Guid? branchId,
        Guid? serviceId,
        bool? activeOnly,
        SearchQuery query,
        CancellationToken ct = default);
    Task<ApiResponse<CounterDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<CounterDto>> CreateAsync(CreateCounterRequest request, CancellationToken ct = default);
    Task<ApiResponse<CounterDto>> UpdateAsync(Guid id, UpdateCounterRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default);
}

public interface ITicketQueueService
{
    Task<ApiResponse<PagedResult<TicketDto>>> GetPagedAsync(Guid? branchId, Guid? serviceId, string? status, SearchQuery query, CancellationToken ct = default);
    Task<ApiResponse<TicketDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<TicketDto>> CreateAsync(CreateTicketRequest request, CancellationToken ct = default);
    Task<ApiResponse<TicketDto>> CallNextAsync(Guid ticketId, CallTicketRequest request, CancellationToken ct = default);
    Task<ApiResponse<TicketDto>> CompleteAsync(Guid ticketId, CompleteTicketRequest? request, CancellationToken ct = default);
    Task<ApiResponse<TicketDto>> SkipAsync(Guid ticketId, SkipTicketRequest? request, CancellationToken ct = default);
    Task<ApiResponse<TicketDto>> CancelAsync(Guid ticketId, CancellationToken ct = default);
}

public interface IQueueLogService
{
    Task<ApiResponse<PagedResult<QueueLogDto>>> GetPagedAsync(Guid? ticketId, SearchQuery query, CancellationToken ct = default);
}

public interface INotificationService
{
    Task<ApiResponse<PagedResult<NotificationDto>>> GetPagedAsync(Guid? userId, SearchQuery query, CancellationToken ct = default);
    Task<ApiResponse<NotificationDto>> CreateAsync(CreateNotificationRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> MarkReadAsync(Guid id, CancellationToken ct = default);
}

public interface IAuditLogService
{
    Task<ApiResponse<PagedResult<AuditLogDto>>> GetPagedAsync(SearchQuery query, CancellationToken ct = default);
}

public interface IReportService
{
    Task<ApiResponse<IReadOnlyList<DailyReportDto>>> DailyAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<ApiResponse<IReadOnlyList<PeakHoursDto>>> PeakHoursAsync(Guid? branchId, DateTime day, CancellationToken ct = default);
    Task<ApiResponse<IReadOnlyList<StaffPerformanceDto>>> StaffPerformanceAsync(Guid? branchId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<ApiResponse<QueueStatisticsDto>> QueueStatsAsync(Guid branchId, CancellationToken ct = default);
    Task<ApiResponse<IReadOnlyList<BranchStatisticsDto>>> BranchStatsAsync(CancellationToken ct = default);
}
