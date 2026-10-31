using CuteDatingScheduler.Api.Contracts;
using CuteDatingScheduler.Api.Data;
using CuteDatingScheduler.Api.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[Route("api/combo-dates")]
public sealed class ComboDatesController : CatalogControllerBase<ComboDate, ComboDateRequest>
{
    private readonly MongoDbContext db;
    public ComboDatesController(MongoDbContext db) => this.db = db;
    protected override IMongoCollection<ComboDate> Collection => db.ComboDates;

    protected override ComboDate Map(ComboDateRequest request, ComboDate entity)
    {
        entity.Title = request.Title.Trim();
        entity.Description = request.Description.Trim();
        entity.Icon = request.Icon.Trim();
        entity.LocationIds = request.LocationIds.Distinct().Select(ObjectId.Parse).ToList();
        return entity;
    }

    protected override async Task<string?> ValidateAsync(ComboDateRequest request, CancellationToken ct)
    {
        if (request.LocationIds.Count == 0 || request.LocationIds.Any(x => !ObjectId.TryParse(x, out _)))
            return "Combo phải có ít nhất một địa điểm hợp lệ.";

        var distinctIds = request.LocationIds.Distinct().ToList();
        var count = await db.Locations.CountDocumentsAsync(
            Builders<Location>.Filter.In(x => x.Id, distinctIds), cancellationToken: ct);
        return count == distinctIds.Count ? null : "Một hoặc nhiều địa điểm không tồn tại.";
    }

    protected override async Task<string?> ValidateDeleteAsync(string id, CancellationToken ct) =>
        await db.DateEvents.Find(x => x.ComboId == id).AnyAsync(ct)
            ? "Combo đang được dùng trong lịch hẹn."
            : null;
}
