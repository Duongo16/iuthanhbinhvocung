using MongoDB.Bson.Serialization.Attributes;

namespace CuteDatingScheduler.Api.Models;

[BsonIgnoreExtraElements]
public sealed class Voucher : EntityBase
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("icon")]
    public string Icon { get; set; } = "🎟️";
}
