using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Services;
using Backend.Helpers;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class QueueOfferingService : IQueueOfferingService
{
    private readonly ApplicationDbContext _db;
    private readonly IRepository<QueueService> _services;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public QueueOfferingService(ApplicationDbContext db, IRepository<QueueService> services, IUnitOfWork uow, IMapper mapper)
    {
        _db = db;
        _services = services;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<QueueServiceDto>>> GetPagedAsync(Guid? branchId, SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Services.AsNoTracking().Include(s => s.Branch).Where(s => !s.IsDeleted);
        if (branchId.HasValue) q = q.Where(s => s.BranchId == branchId.Value);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s));
        }

        q = q.OrderBy(x => x.Branch!.Name).ThenBy(x => x.Name);
        var page = await q.ProjectTo<QueueServiceDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return ApiResponse<PagedResult<QueueServiceDto>>.Ok(page);
    }

    public async Task<ApiResponse<QueueServiceDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var dto = await _db.Services.AsNoTracking()
            .Where(s => s.Id == id && !s.IsDeleted)
            .ProjectTo<QueueServiceDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(ct);
        return dto == null ? ApiResponse<QueueServiceDto>.Fail("Service not found") : ApiResponse<QueueServiceDto>.Ok(dto);
    }

    public async Task<ApiResponse<QueueServiceDto>> CreateAsync(CreateQueueServiceRequest request, CancellationToken ct = default)
    {
        if (!await _db.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted, ct))
            return ApiResponse<QueueServiceDto>.Fail("Branch not found");
        if (await _db.Services.AnyAsync(s => s.BranchId == request.BranchId && s.Code == request.Code && !s.IsDeleted, ct))
            return ApiResponse<QueueServiceDto>.Fail("Service code already exists for branch");

        var entity = _mapper.Map<QueueService>(request);
        await _services.AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);
        await _db.Entry(entity).Reference(s => s.Branch).LoadAsync(ct);
        return ApiResponse<QueueServiceDto>.Ok(_mapper.Map<QueueServiceDto>(entity));
    }

    public async Task<ApiResponse<QueueServiceDto>> UpdateAsync(Guid id, UpdateQueueServiceRequest request, CancellationToken ct = default)
    {
        var entity = await _services.GetByIdAsync(id, ct);
        if (entity == null) return ApiResponse<QueueServiceDto>.Fail("Service not found");

        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != entity.Code)
        {
            if (await _db.Services.AnyAsync(s => s.BranchId == entity.BranchId && s.Code == request.Code && s.Id != id && !s.IsDeleted, ct))
                return ApiResponse<QueueServiceDto>.Fail("Service code already exists for branch");
            entity.Code = request.Code.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name.Trim();
        if (request.Description != null) entity.Description = request.Description;
        if (request.AverageHandlingMinutes.HasValue) entity.AverageHandlingMinutes = request.AverageHandlingMinutes.Value;
        if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;

        _services.Update(entity);
        await _uow.SaveChangesAsync(ct);
        await _db.Entry(entity).Reference(s => s.Branch).LoadAsync(ct);
        return ApiResponse<QueueServiceDto>.Ok(_mapper.Map<QueueServiceDto>(entity));
    }

    public async Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _services.GetByIdAsync(id, ct);
        if (entity == null) return ApiResponse<bool>.Fail("Service not found");
        _services.SoftDelete(entity);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
