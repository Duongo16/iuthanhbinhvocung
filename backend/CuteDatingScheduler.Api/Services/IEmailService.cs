using CuteDatingScheduler.Api.Models;

namespace CuteDatingScheduler.Api.Services;

public interface IEmailService
{
    Task SendInvitationAsync(DateEvent dateEvent, string? editReason, CancellationToken cancellationToken);
}
