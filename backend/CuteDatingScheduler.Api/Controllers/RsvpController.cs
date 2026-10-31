using System.Text.Encodings.Web;
using CuteDatingScheduler.Api.Contracts;
using CuteDatingScheduler.Api.Data;
using CuteDatingScheduler.Api.Models;
using CuteDatingScheduler.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[ApiController]
[Route("api/rsvp")]
public sealed class RsvpController : ControllerBase
{
    private readonly MongoDbContext db;
    private readonly RsvpTokenService tokens;

    public RsvpController(MongoDbContext db, RsvpTokenService tokens)
    {
        this.db = db;
        this.tokens = tokens;
    }

    [HttpGet("confirm")]
    public async Task<IActionResult> Confirm(
        [FromQuery] string token, [FromQuery] string decision, CancellationToken ct)
    {
        if (!TryDecision(decision, out _) || !tokens.TryRead(token, out var id, out var revision))
            return BadRequest("Liên kết RSVP không hợp lệ.");

        var item = await db.DateEvents.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (item is null || item.UpdatedAt.Ticks != revision ||
            item.Status is not (DateEventStatus.Pending or DateEventStatus.Reschedule))
            return Conflict("Lời mời đã thay đổi hoặc đã được trả lời.");

        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["Referrer-Policy"] = "no-referrer";
        var action = decision == "accept" ? "Duyệt luôn 💖" : "Khoan, đổi lịch ☁️";
        var html = $"""
            <!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Xác nhận lời hẹn</title></head>
            <body style="font-family:Arial,sans-serif;background:#dceeff;color:#3f3a5a;display:grid;min-height:100vh;place-items:center;margin:0">
              <main style="background:#fff9f2;border-radius:32px;padding:36px;max-width:450px;text-align:center;box-shadow:0 12px 32px #a9a1c455">
                <div style="font-size:36px">☁️ ✨ ☁️</div>
                <h1>Nhấn để xác nhận</h1>
                <p>Bạn sắp chọn: <strong>{HtmlEncoder.Default.Encode(action)}</strong></p>
                <form method="post" action="/api/rsvp/respond-form">
                  <input type="hidden" name="token" value="{HtmlEncoder.Default.Encode(token)}">
                  <input type="hidden" name="decision" value="{HtmlEncoder.Default.Encode(decision)}">
                  <button style="border:0;border-radius:30px;padding:14px 24px;background:#cdb4db;font-weight:bold;cursor:pointer">Xác nhận lựa chọn</button>
                </form>
              </main>
            </body></html>
            """;
        return Content(html, "text/html; charset=utf-8");
    }

    [HttpPost("respond")]
    public Task<IActionResult> Respond([FromBody] RsvpResponseRequest request, CancellationToken ct) =>
        ApplyAsync(request.Token, request.Decision, false, ct);

    [HttpPost("respond-form")]
    [Consumes("application/x-www-form-urlencoded")]
    public Task<IActionResult> RespondForm(
        [FromForm] string token, [FromForm] string decision, CancellationToken ct) =>
        ApplyAsync(token, decision, true, ct);

    private async Task<IActionResult> ApplyAsync(string token, string decision, bool html, CancellationToken ct)
    {
        if (!TryDecision(decision, out var status) || !tokens.TryRead(token, out var id, out var revision))
            return BadRequest(new { message = "Liên kết RSVP không hợp lệ." });

        var item = await db.DateEvents.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (item is null || item.UpdatedAt.Ticks != revision ||
            item.Status is not (DateEventStatus.Pending or DateEventStatus.Reschedule))
            return Conflict(new { message = "Lời mời đã thay đổi hoặc đã được trả lời." });

        var result = await db.DateEvents.UpdateOneAsync(
            x => x.Id == id && x.UpdatedAt == item.UpdatedAt &&
                 (x.Status == DateEventStatus.Pending || x.Status == DateEventStatus.Reschedule),
            Builders<DateEvent>.Update
                .Set(x => x.Status, status)
                .Set(x => x.UpdatedAt, UtcClock.Next(item.UpdatedAt)),
            cancellationToken: ct);
        if (result.ModifiedCount == 0)
            return Conflict(new { message = "Lời mời vừa được trả lời ở nơi khác." });

        if (!html) return Ok(new { eventId = id, status = status.ToString() });

        Response.Headers["Cache-Control"] = "no-store";
        var text = status == DateEventStatus.Accepted
            ? "Đã duyệt buổi hẹn. Hẹn gặp nhau dưới trời sao! 💖"
            : "Đã gửi lời nhắn muốn đổi lịch. ☁️";
        return Content($"""
            <!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Đã trả lời</title></head>
            <body style="font-family:Arial,sans-serif;background:#dceeff;color:#3f3a5a;display:grid;min-height:100vh;place-items:center">
              <main style="background:#fff9f2;border-radius:32px;padding:36px;text-align:center"><h1>{HtmlEncoder.Default.Encode(text)}</h1></main>
            </body></html>
            """, "text/html; charset=utf-8");
    }

    private static bool TryDecision(string decision, out DateEventStatus status)
    {
        status = decision switch
        {
            "accept" => DateEventStatus.Accepted,
            "reschedule" => DateEventStatus.Reschedule,
            _ => DateEventStatus.Pending
        };
        return decision is "accept" or "reschedule";
    }
}
