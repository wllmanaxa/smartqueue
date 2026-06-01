using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        if (await db.Roles.AnyAsync()) return;

        var roles = new[]
        {
            new Role { Name = "Admin", Description = "System administrator" },
            new Role { Name = "Staff", Description = "Counter staff" },
            new Role { Name = "Receptionist", Description = "Reception / queue desk" },
            new Role { Name = "Customer", Description = "Customer portal" }
        };
        await db.Roles.AddRangeAsync(roles);
        await db.SaveChangesAsync();

        var adminRole = roles.First(r => r.Name == "Admin");
        var staffRole = roles.First(r => r.Name == "Staff");
        var receptionistRole = roles.First(r => r.Name == "Receptionist");

        var branch = new Branch
        {
            Name = "Main Branch",
            Code = "MAIN",
            Address = "100 Queue Street",
            Phone = "+1-555-0100",
            TimeZone = "UTC",
            IsActive = true
        };
        await db.Branches.AddAsync(branch);
        await db.SaveChangesAsync();

        var svc = new QueueService
        {
            BranchId = branch.Id,
            Name = "General Consultation",
            Code = "GEN",
            AverageHandlingMinutes = 12,
            IsActive = true
        };
        var svc2 = new QueueService
        {
            BranchId = branch.Id,
            Name = "Payments",
            Code = "PAY",
            AverageHandlingMinutes = 8,
            IsActive = true
        };
        await db.Services.AddRangeAsync(svc, svc2);
        await db.SaveChangesAsync();

        var counter = new Counter
        {
            BranchId = branch.Id,
            Name = "Counter 1",
            Number = "C1",
            IsActive = true
        };
        counter.Services.Add(svc);
        counter.Services.Add(svc2);
        await db.Counters.AddAsync(counter);
        await db.SaveChangesAsync();

        var admin = new User
        {
            UserName = "admin",
            Email = "admin@smartqueue.local",
            FullName = "Administrator",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            RoleId = adminRole.Id,
            BranchId = null,
            IsActive = true
        };
        var receptionist = new User
        {
            UserName = "reception",
            Email = "reception@smartqueue.local",
            FullName = "Front Desk",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Reception@123"),
            RoleId = receptionistRole.Id,
            BranchId = branch.Id,
            IsActive = true
        };
        var staff = new User
        {
            UserName = "staff1",
            Email = "staff1@smartqueue.local",
            FullName = "Staff One",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
            RoleId = staffRole.Id,
            BranchId = branch.Id,
            IsActive = true
        };
        counter.StaffUserId = staff.Id;
        await db.Users.AddRangeAsync(admin, receptionist, staff);
        await db.SaveChangesAsync();
    }
}
