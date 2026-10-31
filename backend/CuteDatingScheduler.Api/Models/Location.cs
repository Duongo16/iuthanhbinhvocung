using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace CuteDatingScheduler.Api.Models;

[BsonIgnoreExtraElements]
public sealed class Location : EntityBase
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty;

    [BsonElement("area")]
    public string Area { get; set; } = string.Empty;

    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("mapsLink")]
    public string MapsLink { get; set; } = string.Empty;

    [BsonElement("images")]
    public List<string> Images { get; set; } = [];

    [BsonElement("tiktokLink")]
    public string TikTokLink { get; set; } = string.Empty;

    [BsonElement("youtubeLink")]
    public string YoutubeLink { get; set; } = string.Empty;

    [BsonElement("cost_estimate")]
    [JsonPropertyName("cost_estimate")]
    public decimal CostEstimate { get; set; }

    [BsonElement("notes")]
    public string Notes { get; set; } = string.Empty;
}
