using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace CuteDatingScheduler.Api.Models;

[BsonIgnoreExtraElements]
public sealed class CoupleProfile : EntityBase
{
    [BsonElement("avatar_user")]
    [JsonPropertyName("avatar_user")]
    public string AvatarUser { get; set; } = string.Empty;

    [BsonElement("avatar_partner")]
    [JsonPropertyName("avatar_partner")]
    public string AvatarPartner { get; set; } = string.Empty;

    [BsonElement("cover_photo")]
    [JsonPropertyName("cover_photo")]
    public string CoverPhoto { get; set; } = string.Empty;

    [BsonElement("nickname_user")]
    [JsonPropertyName("nickname_user")]
    public string NicknameUser { get; set; } = string.Empty;

    [BsonElement("nickname_partner")]
    [JsonPropertyName("nickname_partner")]
    public string NicknamePartner { get; set; } = string.Empty;
}
