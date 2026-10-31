using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CuteDatingScheduler.Api.Models;

[BsonIgnoreExtraElements]
public sealed class ComboDate : EntityBase
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("icon")]
    public string Icon { get; set; } = "✨";

    [BsonElement("locationIds")]
    public List<ObjectId> LocationIds { get; set; } = [];
}
