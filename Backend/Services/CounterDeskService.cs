using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Counters;
using Backend.Helpers;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class CounterDeskService : ICounterDeskService
{
    private readonly ApplicationDbContext _db;
    private readonly IRepository<Counter> _counters;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CounterDeskService(ApplicationDbContext db, IRepository<Counter> counters, IUnitOfWork uow, IMapper mapper)
    {
        _db = db;
        _counters = counters;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<CounterDto>>> GetPagedAsync(
        Guid? branchId,
        Guid? serviceId,
        bool? activeOnly,
        SearchQuery query,
        CancellationToken ct = default)
    {
        var q = _db.Counters.AsNoTracking()
            .Include(c => c.Branch)
            .Include(c => c.StaffUser)
            .Include(c => c.Services)
            .Where(c => !c.IsDeleted);
        if (branchId.HasValue) q = q.Where(c => c.BranchId == branchId.Value);
        if (serviceId.HasValue)
            q = q.Where(c => c.Services.Any(s => s.Id == serviceId.Value));
        if (activeOnly == true) q = q.Where(c => c.IsActive);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(c => c.Name.ToLower().Contains(s) || c.Number.ToLower().Contains(s));
        }

        q = q.OrderBy(c => c.Branch!.Name).ThenBy(c => c.Number);
        var list = await q.ToListAsync(ct);
        var dtos = list.Select(x => _mapper.Map<CounterDto>(x)).ToList();
        var total = dtos.Count;
        var items = dtos.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToList();
        var page = new PagedResult<CounterDto>
        {
            Items = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = total
        };
        return ApiResponse<PagedResult<CounterDto>>.Ok(page);
    }

    public async Task<ApiResponse<CounterDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Counters.AsNoTracking()
            .Include(c => c.Branch)
            .Include(c => c.StaffUser)
            .Include(c => c.Services)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
        return entity == null
            ? ApiResponse<CounterDto>.Fail("Counter not found")
            : ApiResponse<CounterDto>.Ok(_mapper.Map<CounterDto>(entity));
    }

    public async Task<ApiResponse<CounterDto>> CreateAsync(CreateCounterRequest request, CancellationToken ct = default)
    {
        if (!await _db.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted, ct))
            return ApiResponse<CounterDto>.Fail("Branch not found");
        if (await _db.Counters.AnyAsync(c => c.BranchId == request.BranchId && c.Number == request.Number && !c.IsDeleted, ct))
            return ApiResponse<CounterDto>.Fail("Counter number already exists for branch");

        var services = await _db.Services
            .Where(s => request.ServiceIds.Contains(s.Id) && s.BranchId == request.BranchId && !s.IsDeleted)
            .ToListAsync(ct);
        if (services.Count != request.ServiceIds.Distinct().Count())
            return ApiResponse<CounterDto>.Fail("One or more services are invalid for this branch");

        var counter = new Counter
        {
            Name = request.Name.Trim(),
            Number = request.Number.Trim(),
            BranchId = request.BranchId,
            StaffUserId = request.StaffUserId,
            IsActive = request.IsActive
        };
        foreach (var s in services) counter.Services.Add(s);

        await _counters.AddAsync(counter, ct);
        await _uow.SaveChangesAsync(ct);

        await _db.Entry(counter).Reference(c => c.Branch).LoadAsync(ct);
        await _db.Entry(counter).Reference(c => c.StaffUser).LoadAsync(ct);
        await _db.Entry(counter).Collection(c => c.Services).LoadAsync(ct);
        return ApiResponse<CounterDto>.Ok(_mapper.Map<CounterDto>(counter));
    }

    public async Task<ApiResponse<CounterDto>> UpdateAsync(Guid id, UpdateCounterRequest request, CancellationToken ct = default)
    {
        var counter = await _db.Counters.Include(c => c.Services).FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
        if (counter == null) return ApiResponse<CounterDto>.Fail("Counter not found");

        if (!string.IsNullOrWhiteSpace(request.Number) && request.Number != counter.Number)
        {
            if (await _db.Counters.AnyAsync(c => c.BranchId == counter.BranchId && c.Number == request.Number && c.Id != id && !c.IsDeleted, ct))
                return ApiResponse<CounterDto>.Fail("Counter number already exists for branch");
            counter.Number = request.Number.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Name)) counter.Name = request.Name.Trim();
        if (request.StaffUserId != null) counter.StaffUserId = request.StaffUserId;
        if (request.IsActive.HasValue) counter.IsActive = request.IsActive.Value;

        if (request.ServiceIds != null)
        {
            var services = await _db.Services
                .Where(s => request.ServiceIds.Contains(s.Id) && s.BranchId == counter.BranchId && !s.IsDeleted)
                .ToListAsync(ct);
            if (services.Count != request.ServiceIds.Distinct().Count())
                return ApiResponse<CounterDto>.Fail("One or more services are invalid for this branch");
            counter.Services.Clear();
            foreach (var s in services) counter.Services.Add(s);
        }

        _counters.Update(counter);
        await _uow.SaveChangesAsync(ct);

        await _db.Entry(counter).Reference(c => c.Branch).LoadAsync(ct);
        await _db.Entry(counter).Reference(c => c.StaffUser).LoadAsync(ct);
        await _db.Entry(counter).Collection(c => c.Services).LoadAsync(ct);
        return ApiResponse<CounterDto>.Ok(_mapper.Map<CounterDto>(counter));
    }

    public async Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _counters.GetByIdAsync(id, ct);
        if (entity == null) return ApiResponse<bool>.Fail("Counter not found");
        _counters.SoftDelete(entity);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
