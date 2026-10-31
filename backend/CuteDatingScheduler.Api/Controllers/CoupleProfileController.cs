using CuteDatingScheduler.Api.Contracts;
using CuteDatingScheduler.Api.Data;
using CuteDatingScheduler.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[ApiController]
[Route("api/couple-profile")]
public sealed class CoupleProfileController : ControllerBase
{
    private const string ProfileId = "000000000000000000000001";
    private readonly MongoDbContext db;

    public CoupleProfileController(MongoDbContext db) => this.db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var profile = await db.CoupleProfiles.Find(x => x.Id == ProfileId).FirstOrDefaultAsync(ct);
        return profile is null ? NotFound() : Ok(profile);
    }

    [Authorize]
    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] CoupleProfileRequest request, CancellationToken ct)
    {
        var profile = await db.CoupleProfiles.Find(x => x.Id == ProfileId).FirstOrDefaultAsync(ct)
            ?? new CoupleProfile { Id = ProfileId, CreatedAt = DateTime.UtcNow };
        profile.AvatarUser = request.AvatarUser?.Trim() ?? string.Empty;
        profile.AvatarPartner = request.AvatarPartner?.Trim() ?? string.Empty;
        profile.CoverPhoto = request.CoverPhoto?.Trim() ?? string.Empty;
        profile.NicknameUser = request.NicknameUser.Trim();
        profile.NicknamePartner = request.NicknamePartner.Trim();
        profile.UpdatedAt = DateTime.UtcNow;
        await db.CoupleProfiles.ReplaceOneAsync(
            x => x.Id == ProfileId, profile, new ReplaceOptions { IsUpsert = true }, ct);
        return Ok(profile);
    }
}
