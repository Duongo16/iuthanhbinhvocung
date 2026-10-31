using System.Text.Json;
using System.Text.Json.Serialization;
using MongoDB.Bson;

namespace CuteDatingScheduler.Api.Contracts;

public sealed class ObjectIdJsonConverter : JsonConverter<ObjectId>
{
    public override ObjectId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (!ObjectId.TryParse(value, out var objectId))
            throw new JsonException("ObjectId không hợp lệ.");
        return objectId;
    }

    public override void Write(Utf8JsonWriter writer, ObjectId value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
