using FluentValidation;
using Backend.DTOs.Tickets;

namespace Backend.Validators;

public class CreateTicketRequestValidator : AbstractValidator<CreateTicketRequest>
{
    public CreateTicketRequestValidator()
    {
        RuleFor(x => x.BranchId)
            .NotEmpty()
            .WithMessage("Branch is required");

        RuleFor(x => x.ServiceId)
            .NotEmpty()
            .WithMessage("Service is required");

        RuleFor(x => x.Priority)
            .NotEmpty()
            .WithMessage("Priority is required");
    }
}

public class CallTicketRequestValidator : AbstractValidator<CallTicketRequest>
{
    public CallTicketRequestValidator()
    {
        RuleFor(x => x.CounterId)
            .NotEmpty()
            .WithMessage("Counter is required");
    }
}
