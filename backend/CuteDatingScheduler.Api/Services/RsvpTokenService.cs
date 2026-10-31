using System.Globalization;
using Microsoft.AspNetCore.DataProtection;

namespace CuteDatingScheduler.Api.Services;

public sealed class RsvpTokenService
{
    private readonly IDataProtector protector;

    public RsvpTokenService(IDataProtectionProvider provider)
    {
        protector = provider.CreateProtector("CuteDatingScheduler.Rsvp.v1");
    }

    public string Create(string eventId, DateTime updatedAt)
    {
        var expiresAt = DateTime.UtcNow.AddDays(14).Ticks;
        return protector.Protect($"{eventId}|{updatedAt.Ticks}|{expiresAt}");
    }

    public bool TryRead(string token, out string eventId, out long revision)
    {
        eventId = string.Empty;
        revision = 0;
        try
        {
            var parts = protector.Unprotect(token).Split('|');
            if (parts.Length != 3 ||
                !long.TryParse(parts[1], NumberStyles.None, CultureInfo.InvariantCulture, out revision) ||
                !long.TryParse(parts[2], NumberStyles.None, CultureInfo.InvariantCulture, out var expiresAt) ||
                expiresAt < DateTime.UtcNow.Ticks)
            {
                return false;
            }

            eventId = parts[0];
            return MongoDB.Bson.ObjectId.TryParse(eventId, out _);
        }
        catch (System.Security.Cryptography.CryptographicException)
        {
            return false;
        }
    }
}
