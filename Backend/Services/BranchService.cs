using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Branches;
using Backend.DTOs.Common;
using Backend.Helpers;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class BranchService : IBranchService
{
    private readonly ApplicationDbContext _db;
    private readonly IRepository<Branch> _branches;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public BranchService(ApplicationDbContext db, IRepository<Branch> branches, IUnitOfWork uow, IMapper mapper)
    {
        _db = db;
        _branches = branches;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<BranchDto>>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Branches.AsNoTracking().Where(b => !b.IsDeleted);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(b => b.Name.ToLower().Contains(s) || b.Code.ToLower().Contains(s));
        }

        q = q.OrderBy(b => b.Name);
        var page = await q.ProjectTo<BranchDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return ApiResponse<PagedResult<BranchDto>>.Ok(page);
    }

    public async Task<ApiResponse<BranchDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var dto = await _db.Branches.AsNoTracking()
            .Where(b => b.Id == id && !b.IsDeleted)
            .ProjectTo<BranchDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(ct);
        return dto == null ? ApiResponse<BranchDto>.Fail("Branch not found") : ApiResponse<BranchDto>.Ok(dto);
    }

    public async Task<ApiResponse<BranchDto>> CreateAsync(CreateBranchRequest request, CancellationToken ct = default)
    {
        if (await _db.Branches.AnyAsync(b => b.Code == request.Code && !b.IsDeleted, ct))
            return ApiResponse<BranchDto>.Fail("Branch code already exists");

        var entity = _mapper.Map<Branch>(request);
        await _branches.AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<BranchDto>.Ok(_mapper.Map<BranchDto>(entity));
    }

    public async Task<ApiResponse<BranchDto>> UpdateAsync(Guid id, UpdateBranchRequest request, CancellationToken ct = default)
    {
        var entity = await _branches.GetByIdAsync(id, ct);
        if (entity == null) return ApiResponse<BranchDto>.Fail("Branch not found");

        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != entity.Code)
        {
            if (await _db.Branches.AnyAsync(b => b.Code == request.Code && b.Id != id && !b.IsDeleted, ct))
                return ApiResponse<BranchDto>.Fail("Branch code already exists");
            entity.Code = request.Code.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name.Trim();
        if (request.Address != null) entity.Address = request.Address;
        if (request.Phone != null) entity.Phone = request.Phone;
        if (request.TimeZone != null) entity.TimeZone = request.TimeZone;
        if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;

        _branches.Update(entity);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<BranchDto>.Ok(_mapper.Map<BranchDto>(entity));
    }

    public async Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _branches.GetByIdAsync(id, ct);
        if (entity == null) return ApiResponse<bool>.Fail("Branch not found");
        _branches.SoftDelete(entity);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
