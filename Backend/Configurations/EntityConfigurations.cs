using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("Roles");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Name).IsUnique();
        b.Property(x => x.Name).HasMaxLength(64).IsRequired();
        b.Property(x => x.Description).HasMaxLength(256);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("Users");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.UserName).IsUnique();
        b.HasIndex(x => x.Email).IsUnique();
        b.Property(x => x.UserName).HasMaxLength(128).IsRequired();
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
        b.Property(x => x.FullName).HasMaxLength(256);
        b.Property(x => x.PhoneNumber).HasMaxLength(32);
        b.HasOne(x => x.Role).WithMany(r => r.Users).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Branch).WithMany(br => br.Users).HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> b)
    {
        b.ToTable("Branches");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class QueueServiceConfiguration : IEntityTypeConfiguration<QueueService>
{
    public void Configure(EntityTypeBuilder<QueueService> b)
    {
        b.ToTable("Services");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.BranchId, x.Code }).IsUnique();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasOne(x => x.Branch).WithMany(br => br.Services).HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Counters).WithMany(c => c.Services).UsingEntity(j => j.ToTable("CounterServices"));
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class CounterConfiguration : IEntityTypeConfiguration<Counter>
{
    public void Configure(EntityTypeBuilder<Counter> b)
    {
        b.ToTable("Counters");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.BranchId, x.Number }).IsUnique();
        b.Property(x => x.Name).HasMaxLength(128).IsRequired();
        b.Property(x => x.Number).HasMaxLength(32).IsRequired();
        b.HasOne(x => x.Branch).WithMany(br => br.Counters).HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.StaffUser).WithMany(u => u.Counters).HasForeignKey(x => x.StaffUserId).OnDelete(DeleteBehavior.SetNull);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> b)
    {
        b.ToTable("Tickets");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.BranchId, x.TicketNumber }).IsUnique();
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CreatedAt);
        b.Property(x => x.TicketNumber).HasMaxLength(64).IsRequired();
        b.Property(x => x.QrPayload).HasMaxLength(1024);
        b.HasOne(x => x.Branch).WithMany(br => br.Tickets).HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Service).WithMany(s => s.Tickets).HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Counter).WithMany(c => c.Tickets).HasForeignKey(x => x.CounterId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.CustomerUser).WithMany().HasForeignKey(x => x.CustomerUserId).OnDelete(DeleteBehavior.SetNull);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class QueueLogConfiguration : IEntityTypeConfiguration<QueueLog>
{
    public void Configure(EntityTypeBuilder<QueueLog> b)
    {
        b.ToTable("QueueLogs");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.TicketId);
        b.HasIndex(x => x.CreatedAt);
        b.Property(x => x.Notes).HasMaxLength(1024);
        b.HasOne(x => x.Ticket).WithMany(t => t.QueueLogs).HasForeignKey(x => x.TicketId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.PerformedByUser).WithMany().HasForeignKey(x => x.PerformedByUserId).OnDelete(DeleteBehavior.SetNull);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.UserId);
        b.Property(x => x.Title).HasMaxLength(256).IsRequired();
        b.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        b.HasOne(x => x.User).WithMany(u => u.Notifications).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Ticket).WithMany().HasForeignKey(x => x.TicketId).OnDelete(DeleteBehavior.SetNull);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("AuditLogs");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.CreatedAt);
        b.HasIndex(x => x.EntityName);
        b.Property(x => x.EntityName).HasMaxLength(128).IsRequired();
        b.Property(x => x.Action).HasMaxLength(64).IsRequired();
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Token).IsUnique();
        b.Property(x => x.Token).HasMaxLength(512).IsRequired();
        b.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        // Align with User soft-delete filter so required User navigation is not inconsistent (EF warning 10622).
        b.HasQueryFilter(rt => !rt.User.IsDeleted);
    }
}
