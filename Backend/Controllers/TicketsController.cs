using Asp.Versioning;
using Backend.DTOs.Common;
using Backend.DTOs.Tickets;
using Backend.Helpers;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Authorize]
public class TicketsController : ApiControllerBase
{
    private readonly ITicketQueueService _tickets;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(ITicketQueueService tickets, ILogger<TicketsController> logger)
    {
        _tickets = tickets;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Policy = "StaffDesk")]
    public async Task<ActionResult<ApiResponse<PagedResult<TicketDto>>>> GetPage(
        [FromQuery] Guid? branchId,
        [FromQuery] Guid? serviceId,
        [FromQuery] string? status,
        [FromQuery] SearchQuery query,
        CancellationToken ct) =>
        Ok(await _tickets.GetPagedAsync(branchId, serviceId, status, query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> GetById(Guid id, CancellationToken ct)
    {
        var r = await _tickets.GetByIdAsync(id, ct);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff},{AppRoles.Receptionist},{AppRoles.Customer}")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Create([FromBody] CreateTicketRequest request, CancellationToken ct)
    {
        try
        {
            var r = await _tickets.CreateAsync(request, ct);
            return r.Success ? CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r) : BadRequest(r);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception creating ticket. Message: {Message}", ex.Message);
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse<TicketDto>.Fail("Unable to create ticket. Please try again."));
        }
    }

    [HttpPost("{id:guid}/call")]
    [Authorize(Policy = "StaffDesk")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Call(Guid id, [FromBody] CallTicketRequest request, CancellationToken ct)
    {
        var r = await _tickets.CallNextAsync(id, request, ct);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPost("{id:guid}/complete")]
    [Authorize(Policy = "StaffDesk")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Complete(Guid id, [FromBody] CompleteTicketRequest? request, CancellationToken ct)
    {
        var r = await _tickets.CompleteAsync(id, request, ct);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPost("{id:guid}/skip")]
    [Authorize(Policy = "StaffDesk")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Skip(Guid id, [FromBody] SkipTicketRequest? request, CancellationToken ct)
    {
        var r = await _tickets.SkipAsync(id, request, ct);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "StaffDesk")]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Cancel(Guid id, CancellationToken ct)
    {
        var r = await _tickets.CancelAsync(id, ct);
        return r.Success ? Ok(r) : BadRequest(r);
    }
}
