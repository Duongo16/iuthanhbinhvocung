using CuteDatingScheduler.Api.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Data;

public sealed class MongoDbContext
{
    private readonly IMongoDatabase database;

    public MongoDbContext(IOptions<MongoDbSettings> options)
    {
        var settings = options.Value;
        var client = new MongoClient(settings.ConnectionString);
        database = client.GetDatabase(settings.DatabaseName);
    }

    public IMongoCollection<CoupleProfile> CoupleProfiles =>
        database.GetCollection<CoupleProfile>("couple_profiles");

    public IMongoCollection<Location> Locations =>
        database.GetCollection<Location>("locations");

    public IMongoCollection<ComboDate> ComboDates =>
        database.GetCollection<ComboDate>("combo_dates");

    public IMongoCollection<Voucher> Vouchers =>
        database.GetCollection<Voucher>("vouchers");

    public IMongoCollection<DateEvent> DateEvents =>
        database.GetCollection<DateEvent>("date_events");
}
