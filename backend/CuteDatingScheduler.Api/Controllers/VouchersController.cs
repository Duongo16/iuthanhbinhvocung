using CuteDatingScheduler.Api.Contracts;
using CuteDatingScheduler.Api.Data;
using CuteDatingScheduler.Api.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[Route("api/vouchers")]
public sealed class VouchersController : CatalogControllerBase<Voucher, VoucherRequest>
{
    private readonly MongoDbContext db;
    public VouchersController(MongoDbContext db) => this.db = db;
    protected override IMongoCollection<Voucher> Collection => db.Vouchers;

    protected override Voucher Map(VoucherRequest request, Voucher entity)
    {
        entity.Name = request.Name.Trim();
        entity.Description = request.Description.Trim();
        entity.Icon = request.Icon.Trim();
        return entity;
    }

    protected override async Task<string?> ValidateDeleteAsync(string id, CancellationToken ct) =>
        await db.DateEvents.Find(x => x.AppliedVouchers.Contains(ObjectId.Parse(id))).AnyAsync(ct)
            ? "Voucher đang được dùng trong lịch hẹn."
            : null;
}
