using AutoMapper;
using Backend.DTOs.Audit;
using Backend.DTOs.Roles;
using Backend.DTOs.Branches;
using Backend.DTOs.Counters;
using Backend.DTOs.Notifications;
using Backend.DTOs.Queue;
using Backend.DTOs.Services;
using Backend.DTOs.Tickets;
using Backend.DTOs.Users;
using Backend.Models;

namespace Backend.Configurations;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(d => d.RoleName, o => o.MapFrom(s => s.Role.Name))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null));

        CreateMap<Branch, BranchDto>();
        CreateMap<QueueService, QueueServiceDto>()
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch.Name));

        CreateMap<Counter, CounterDto>()
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch.Name))
            .ForMember(d => d.StaffUserName, o => o.MapFrom(s => s.StaffUser != null ? s.StaffUser.UserName : null))
            .ForMember(d => d.ServiceIds, o => o.MapFrom(s => s.Services.Select(x => x.Id).ToList()));

        CreateMap<Ticket, TicketDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Priority, o => o.MapFrom(s => s.Priority.ToString()))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch.Name))
            .ForMember(d => d.ServiceName, o => o.MapFrom(s => s.Service.Name))
            .ForMember(d => d.CounterName, o => o.MapFrom(s => s.Counter != null ? s.Counter.Name : null))
            .ForMember(d => d.EstimatedWaitMinutes, o => o.Ignore());

        CreateMap<QueueLog, QueueLogDto>()
            .ForMember(d => d.Action, o => o.MapFrom(s => s.Action.ToString()))
            .ForMember(d => d.TicketNumber, o => o.MapFrom(s => s.Ticket.TicketNumber))
            .ForMember(d => d.PerformedByUserName, o => o.MapFrom(s => s.PerformedByUser != null ? s.PerformedByUser.UserName : null));

        CreateMap<Notification, NotificationDto>()
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()));

        CreateMap<Role, RoleDto>();
        CreateMap<AuditLog, AuditLogDto>();

        CreateMap<CreateBranchRequest, Branch>();
        CreateMap<CreateQueueServiceRequest, QueueService>();
    }
}
