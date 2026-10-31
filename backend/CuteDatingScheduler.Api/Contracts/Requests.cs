using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CuteDatingScheduler.Api.Contracts;

public sealed class LoginRequest
{
    [Required]
    public string Password { get; init; } = string.Empty;
}

public sealed class LocationRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(80)]
    public string Category { get; init; } = string.Empty;

    [Required, StringLength(100)]
    public string Area { get; init; } = string.Empty;

    [Required, StringLength(300)]
    public string Address { get; init; } = string.Empty;

    [Required, StringLength(30)]
    public string Phone { get; init; } = string.Empty;

    [Required, Url]
    public string MapsLink { get; init; } = string.Empty;

    [Required, MinLength(1)]
    public List<string> Images { get; init; } = [];

    [Url]
    public string? TikTokLink { get; init; }

    [Url]
    public string? YoutubeLink { get; init; }

    [Range(0, 1000000000)]
    [JsonPropertyName("cost_estimate")]
    public decimal CostEstimate { get; init; }

    [StringLength(2000)]
    public string Notes { get; init; } = string.Empty;
}

public sealed class ComboDateRequest
{
    [Required, StringLength(120)]
    public string Title { get; init; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; init; } = string.Empty;

    [StringLength(50)]
    public string Icon { get; init; } = "✨";

    [Required, MinLength(1)]
    public List<string> LocationIds { get; init; } = [];
}

public sealed class VoucherRequest
{
    [Required, StringLength(120)]
    public string Name { get; init; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; init; } = string.Empty;

    [StringLength(50)]
    public string Icon { get; init; } = "🎟️";
}

public sealed class CoupleProfileRequest
{
    [Url, JsonPropertyName("avatar_user")]
    public string? AvatarUser { get; init; }

    [Url, JsonPropertyName("avatar_partner")]
    public string? AvatarPartner { get; init; }

    [Url, JsonPropertyName("cover_photo")]
    public string? CoverPhoto { get; init; }

    [Required, StringLength(80), JsonPropertyName("nickname_user")]
    public string NicknameUser { get; init; } = string.Empty;

    [Required, StringLength(80), JsonPropertyName("nickname_partner")]
    public string NicknamePartner { get; init; } = string.Empty;
}

public sealed class CreateDateEventRequest
{
    [Required, StringLength(80)]
    public string InviterName { get; init; } = string.Empty;

    [Required]
    public DateTime Date { get; init; }

    [Required]
    public string Time { get; init; } = string.Empty;

    [StringLength(200)]
    public string PickupLocation { get; init; } = string.Empty;

    [Required, StringLength(100)]
    public string Dresscode { get; init; } = string.Empty;

    [StringLength(2000)]
    public string Message { get; init; } = string.Empty;

    public string? LocationId { get; init; }

    public string? ComboId { get; init; }

    [Required]
    public List<string> RoadmapLocationIds { get; init; } = [];

    [Required]
    public List<string> AppliedVouchers { get; init; } = [];
}

public sealed class RescheduleDateEventRequest
{
    [Required]
    public DateTime Date { get; init; }

    [Required]
    public string Time { get; init; } = string.Empty;

    public string? LocationId { get; init; }

    public string? ComboId { get; init; }

    [Required]
    public List<string> RoadmapLocationIds { get; init; } = [];

    [Required, MinLength(3), StringLength(1000)]
    public string Reason { get; init; } = string.Empty;
}

public sealed class UpdateMemoriesRequest
{
    [Required]
    public List<string> Photos { get; init; } = [];

    [StringLength(3000)]
    public string ReviewText { get; init; } = string.Empty;

    [StringLength(20)]
    public string Emoji { get; init; } = "💫";
}

public sealed class RsvpResponseRequest
{
    [Required]
    public string Token { get; init; } = string.Empty;

    [Required]
    public string Decision { get; init; } = string.Empty;
}
