using CuteDatingScheduler.Api.Contracts;
using CuteDatingScheduler.Api.Data;
using CuteDatingScheduler.Api.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[Route("api/locations")]
public sealed class LocationsController : CatalogControllerBase<Location, LocationRequest>
{
    private readonly MongoDbContext db;
    public LocationsController(MongoDbContext db) => this.db = db;
    protected override IMongoCollection<Location> Collection => db.Locations;

    protected override Location Map(LocationRequest request, Location entity)
    {
        entity.Name = request.Name.Trim();
        entity.Category = request.Category.Trim();
        entity.Area = request.Area.Trim();
        entity.Address = request.Address.Trim();
        entity.Phone = request.Phone.Trim();
        entity.MapsLink = request.MapsLink?.Trim() ?? string.Empty;
        entity.Images = request.Images.Select(x => x.Trim()).ToList();
        entity.TikTokLink = request.TikTokLink?.Trim() ?? string.Empty;
        entity.YoutubeLink = request.YoutubeLink?.Trim() ?? string.Empty;
        entity.CostEstimate = request.CostEstimate;
        entity.Notes = request.Notes.Trim();
        return entity;
    }

    protected override Task<string?> ValidateAsync(LocationRequest request, CancellationToken ct)
    {
        if (request.Images.Count is < 1 or > 12 || request.Images.Any(x =>
            !Uri.TryCreate(x, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
            return Task.FromResult<string?>("Cần 1–12 ảnh với URL HTTP(S) hợp lệ.");
        if (string.IsNullOrWhiteSpace(request.TikTokLink) && string.IsNullOrWhiteSpace(request.YoutubeLink))
            return Task.FromResult<string?>("Cần ít nhất một link TikTok hoặc YouTube review.");
        return Task.FromResult<string?>(null);
    }

    protected override async Task<string?> ValidateDeleteAsync(string id, CancellationToken ct)
    {
        var objectId = ObjectId.Parse(id);
        if (await db.ComboDates.Find(x => x.LocationIds.Contains(objectId)).AnyAsync(ct) ||
            await db.DateEvents.Find(x => x.LocationId == id || x.RoadmapLocationIds.Contains(objectId)).AnyAsync(ct))
            return "Địa điểm đang được dùng trong combo hoặc lịch hẹn.";
        return null;
    }
}
