using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CuteDatingScheduler.Api.Models;

public enum DateEventStatus
{
    Pending,
    Accepted,
    Reschedule,
    Rejected,
    Completed
}

[BsonIgnoreExtraElements]
public sealed class DateEvent : EntityBase
{
    [BsonElement("inviterName")]
    public string InviterName { get; set; } = string.Empty;

    [BsonElement("date")]
    public DateTime Date { get; set; }

    [BsonElement("time")]
    public string Time { get; set; } = string.Empty;

    [BsonElement("pickupLocation")]
    public string PickupLocation { get; set; } = string.Empty;

    [BsonElement("dresscode")]
    public string Dresscode { get; set; } = string.Empty;

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("locationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfNull]
    public string? LocationId { get; set; }

    [BsonElement("comboId")]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfNull]
    public string? ComboId { get; set; }

    [BsonElement("roadmapLocationIds")]
    public List<ObjectId> RoadmapLocationIds { get; set; } = [];

    [BsonElement("appliedVouchers")]
    public List<ObjectId> AppliedVouchers { get; set; } = [];

    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public DateEventStatus Status { get; set; } = DateEventStatus.Pending;

    [BsonElement("editHistory")]
    public List<DateEditHistory> EditHistory { get; set; } = [];

    [BsonElement("memories")]
    public DateMemories Memories { get; set; } = new();
}

public sealed class DateEditHistory
{
    [BsonElement("editedAt")]
    public DateTime EditedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("reason")]
    public string Reason { get; set; } = string.Empty;

    [BsonElement("previousDate")]
    public DateTime PreviousDate { get; set; }

    [BsonElement("previousTime")]
    public string PreviousTime { get; set; } = string.Empty;

    [BsonElement("previousLocationId")]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfNull]
    public string? PreviousLocationId { get; set; }

    [BsonElement("previousComboId")]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfNull]
    public string? PreviousComboId { get; set; }

    [BsonElement("previousRoadmapLocationIds")]
    public List<ObjectId> PreviousRoadmapLocationIds { get; set; } = [];
}

public sealed class DateMemories
{
    [BsonElement("photos")]
    public List<string> Photos { get; set; } = [];

    [BsonElement("reviewText")]
    public string ReviewText { get; set; } = string.Empty;

    [BsonElement("emoji")]
    public string Emoji { get; set; } = "💫";
}
