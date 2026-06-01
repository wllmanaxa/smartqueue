using Microsoft.EntityFrameworkCore;

namespace Backend.Helpers;

public static class DatabaseExceptionHelper
{
    public static string ToUserMessage(DbUpdateException ex)
    {
        var detail = ex.InnerException?.Message ?? ex.Message;

        if (detail.Contains("FK_QueueLogs_Users_PerformedByUserId", StringComparison.OrdinalIgnoreCase) ||
            detail.Contains("PerformedByUserId", StringComparison.OrdinalIgnoreCase))
            return "The current user record is invalid. Sign in again or contact an administrator.";

        if (detail.Contains("FK_Tickets_Services_ServiceId", StringComparison.OrdinalIgnoreCase))
            return "Service not found";

        if (detail.Contains("FK_Tickets_Branches_BranchId", StringComparison.OrdinalIgnoreCase))
            return "Branch not found";

        if (detail.Contains("FK_Tickets_Users_CustomerUserId", StringComparison.OrdinalIgnoreCase))
            return "Customer user not found";

        if (detail.Contains("IX_Tickets_BranchId_TicketNumber", StringComparison.OrdinalIgnoreCase) ||
            detail.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
            return "A ticket with this number already exists. Please try again.";

        return "A database error occurred while saving the ticket.";
    }
}
