using System.Linq.Expressions;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public interface IRepository<TEntity> where TEntity : BaseEntity
{
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    IQueryable<TEntity> Query(bool includeDeleted = false);
    Task AddAsync(TEntity entity, CancellationToken ct = default);
    void Update(TEntity entity);
    void SoftDelete(TEntity entity);
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
}

public class Repository<TEntity> : IRepository<TEntity> where TEntity : BaseEntity
{
    protected readonly ApplicationDbContext Db;
    protected readonly DbSet<TEntity> Set;

    public Repository(ApplicationDbContext db)
    {
        Db = db;
        Set = db.Set<TEntity>();
    }

    public virtual IQueryable<TEntity> Query(bool includeDeleted = false)
    {
        var q = Set.AsQueryable();
        if (!includeDeleted)
            q = q.Where(e => !e.IsDeleted);
        return q;
    }

    public virtual async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await Query().FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task AddAsync(TEntity entity, CancellationToken ct = default) =>
        await Set.AddAsync(entity, ct);

    public void Update(TEntity entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        Set.Update(entity);
    }

    public void SoftDelete(TEntity entity)
    {
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        Set.Update(entity);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken ct = default) =>
        await Query().AnyAsync(e => e.Id == id, ct);
}
