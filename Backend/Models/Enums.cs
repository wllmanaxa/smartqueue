namespace Backend.Models;

public enum TicketStatus
{
    Waiting = 0,
    Serving = 1,
    Completed = 2,
    Skipped = 3,
    Cancelled = 4
}

public enum TicketPriority
{
    Normal = 0,
    Vip = 1,
    Emergency = 2
}

public enum NotificationType
{
    Info = 0,
    Warning = 1,
    QueueUpdate = 2,
    System = 3
}

public enum QueueLogAction
{
    Created = 0,
    Called = 1,
    ServingStarted = 2,
    Completed = 3,
    Skipped = 4,
    Cancelled = 5,
    PriorityChanged = 6,
    Transferred = 7
}
