using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Notifications;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications) => _notifications = notifications;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetPage(
        [FromQuery] Guid? userId,
        [FromQuery] SearchQuery query,
        CancellationToken ct) =>
        Ok(await _notifications.GetPagedAsync(userId, query, ct));

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Receptionist}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> Create([FromBody] CreateNotificationRequest request, CancellationToken ct)
    {
        var r = await _notifications.CreateAsync(request, ct);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkRead(Guid id, CancellationToken ct)
    {
        var r = await _notifications.MarkReadAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }
}
