using Backend.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Services;

public interface IQueueRealtimeNotifier
{
    Task NotifyBranchAsync(Guid branchId, string eventName, object payload, CancellationToken ct = default);
}

public class QueueRealtimeNotifier : IQueueRealtimeNotifier
{
    private readonly IHubContext<QueueHub> _hub;

    public QueueRealtimeNotifier(IHubContext<QueueHub> hub) => _hub = hub;

    public Task NotifyBranchAsync(Guid branchId, string eventName, object payload, CancellationToken ct = default) =>
        _hub.Clients.Group(QueueHub.BranchGroup(branchId)).SendAsync(eventName, payload, ct);
}
