using AutoMapper;
using AutoMapper.QueryableExtensions;
using Backend.Data;
using Backend.DTOs.Common;
using Backend.DTOs.Users;
using Backend.Helpers;
using Backend.Interfaces;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _db;
    private readonly IRepository<User> _users;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UserService(ApplicationDbContext db, IRepository<User> users, IUnitOfWork uow, IMapper mapper)
    {
        _db = db;
        _users = users;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<UserDto>>> GetPagedAsync(SearchQuery query, CancellationToken ct = default)
    {
        var q = _db.Users.AsNoTracking().Include(u => u.Role).Include(u => u.Branch).Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(u =>
                u.UserName.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s) ||
                (u.FullName != null && u.FullName.ToLower().Contains(s)));
        }

        q = q.OrderBy(u => u.UserName);
        var page = await q.ProjectTo<UserDto>(_mapper.ConfigurationProvider)
            .ToPagedResultAsync(query.PageNumber, query.PageSize, ct);
        return ApiResponse<PagedResult<UserDto>>.Ok(page);
    }

    public async Task<ApiResponse<UserDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var dto = await _db.Users.AsNoTracking()
            .Where(u => u.Id == id && !u.IsDeleted)
            .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(ct);
        return dto == null
            ? ApiResponse<UserDto>.Fail("User not found")
            : ApiResponse<UserDto>.Ok(dto);
    }

    public async Task<ApiResponse<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        if (!await _db.Roles.AnyAsync(r => r.Id == request.RoleId && !r.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Role not found");
        if (request.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Branch not found");
        if (await _db.Users.AnyAsync(u => u.UserName == request.UserName && !u.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Username already taken");
        if (await _db.Users.AnyAsync(u => u.Email == request.Email && !u.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Email already taken");

        var user = new User
        {
            UserName = request.UserName.Trim(),
            Email = request.Email.Trim(),
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = request.RoleId,
            BranchId = request.BranchId,
            IsActive = request.IsActive
        };
        await _users.AddAsync(user, ct);
        await _uow.SaveChangesAsync(ct);

        await _db.Entry(user).Reference(u => u.Role).LoadAsync(ct);
        if (user.BranchId.HasValue)
            await _db.Entry(user).Reference(u => u.Branch).LoadAsync(ct);

        return ApiResponse<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ApiResponse<UserDto>> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user == null) return ApiResponse<UserDto>.Fail("User not found");

        if (request.RoleId.HasValue && !await _db.Roles.AnyAsync(r => r.Id == request.RoleId && !r.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Role not found");
        if (request.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == request.BranchId && !b.IsDeleted, ct))
            return ApiResponse<UserDto>.Fail("Branch not found");

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != id && !u.IsDeleted, ct))
                return ApiResponse<UserDto>.Fail("Email already taken");
            user.Email = request.Email.Trim();
        }

        if (request.FullName != null) user.FullName = request.FullName;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
        if (request.RoleId.HasValue) user.RoleId = request.RoleId.Value;
        if (request.BranchId != null) user.BranchId = request.BranchId;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        _users.Update(user);
        await _uow.SaveChangesAsync(ct);

        await _db.Entry(user).Reference(u => u.Role).LoadAsync(ct);
        if (user.BranchId.HasValue)
            await _db.Entry(user).Reference(u => u.Branch).LoadAsync(ct);

        return ApiResponse<UserDto>.Ok(_mapper.Map<UserDto>(user));
    }

    public async Task<ApiResponse<bool>> SoftDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user == null) return ApiResponse<bool>.Fail("User not found");
        _users.SoftDelete(user);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(Guid id, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user == null) return ApiResponse<bool>.Fail("User not found");
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("Current password is incorrect");
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        _users.Update(user);
        await _uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
