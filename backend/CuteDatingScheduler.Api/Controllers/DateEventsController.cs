using System.Globalization;
using CuteDatingScheduler.Api.Contracts;
using CuteDatingScheduler.Api.Data;
using CuteDatingScheduler.Api.Models;
using CuteDatingScheduler.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace CuteDatingScheduler.Api.Controllers;

[ApiController]
[Route("api/date-events")]
public sealed class DateEventsController : ControllerBase
{
    private readonly MongoDbContext db;
    private readonly IEmailService email;
    private readonly ILogger<DateEventsController> logger;

    public DateEventsController(MongoDbContext db, IEmailService email, ILogger<DateEventsController> logger)
    {
        this.db = db;
        this.email = email;
        this.logger = logger;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct)
    {
        var filter = Builders<DateEvent>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(status))
        {
            var parts = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var statuses = new List<DateEventStatus>();
            foreach (var part in parts)
            {
                if (!Enum.TryParse<DateEventStatus>(part, true, out var parsed) || !Enum.IsDefined(parsed))
                    return BadRequest(new { message = "Status không hợp lệ." });
                statuses.Add(parsed);
            }
            filter = Builders<DateEvent>.Filter.In(x => x.Status, statuses);
        }

        var events = await db.DateEvents.Find(filter)
            .SortByDescending(x => x.Date).ToListAsync(ct);
        return Ok(events);
    }

    [HttpGet("completed")]
    public async Task<IActionResult> Completed(CancellationToken ct)
    {
        var events = await db.DateEvents.Find(x => x.Status == DateEventStatus.Completed)
            .SortByDescending(x => x.Date).ToListAsync(ct);
        return Ok(events);
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> Upcoming(CancellationToken ct)
    {
        var today = DateTime.UtcNow.AddHours(7).Date;
        var events = await db.DateEvents.Find(x =>
                x.Status == DateEventStatus.Accepted && x.Date >= today)
            .SortBy(x => x.Date).Limit(10).ToListAsync(ct);
        return Ok(events);
    }

    [HttpGet("planned")]
    public async Task<IActionResult> Planned(CancellationToken ct)
    {
        var events = await db.DateEvents.Find(x =>
                x.Status == DateEventStatus.Pending ||
                x.Status == DateEventStatus.Accepted ||
                x.Status == DateEventStatus.Reschedule)
            .SortByDescending(x => x.CreatedAt).Limit(50).ToListAsync(ct);
        return Ok(events);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        var item = await db.DateEvents.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDateEventRequest request, CancellationToken ct)
    {
        var error = await ValidateDraftAsync(request.Date, request.Time, request.LocationId,
            request.ComboId, request.RoadmapLocationIds, request.AppliedVouchers, ct);
        if (error is not null) return BadRequest(new { message = error });

        var item = BuildEvent(request, DateEventStatus.Pending);
        await db.DateEvents.InsertOneAsync(item, cancellationToken: ct);
        var sent = await TrySendAsync(item, null, ct);
        return StatusCode(sent ? StatusCodes.Status201Created : StatusCodes.Status202Accepted,
            new { dateEvent = item, emailSent = sent });
    }

    [HttpPost("reject")]
    public async Task<IActionResult> RejectDraft([FromBody] CreateDateEventRequest request, CancellationToken ct)
    {
        var error = await ValidateDraftAsync(request.Date, request.Time, request.LocationId,
            request.ComboId, request.RoadmapLocationIds, request.AppliedVouchers, ct);
        if (error is not null) return BadRequest(new { message = error });
        var item = BuildEvent(request, DateEventStatus.Rejected);
        await db.DateEvents.InsertOneAsync(item, cancellationToken: ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
    }

    [HttpPut("{id}/reschedule")]
    public async Task<IActionResult> Reschedule(
        string id, [FromBody] RescheduleDateEventRequest request, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 3)
            return BadRequest(new { message = "Cần nhập lý do đổi lịch (ít nhất 3 ký tự)." });

        var error = await ValidateDraftAsync(request.Date, request.Time,
            request.LocationId, request.ComboId, request.RoadmapLocationIds, [], ct);
        if (error is not null) return BadRequest(new { message = error });

        var item = await db.DateEvents.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (item is null) return NotFound();
        if (item.Status is DateEventStatus.Completed or DateEventStatus.Rejected)
            return Conflict(new { message = "Lịch hẹn này không thể đổi nữa." });

        var revision = item.UpdatedAt;
        item.EditHistory.Add(new DateEditHistory
        {
            EditedAt = UtcClock.Now(),
            Reason = request.Reason.Trim(),
            PreviousDate = item.Date,
            PreviousTime = item.Time,
            PreviousLocationId = item.LocationId,
            PreviousComboId = item.ComboId,
            PreviousRoadmapLocationIds = item.RoadmapLocationIds.ToList()
        });
        item.Date = NormalizeDate(request.Date);
        item.Time = request.Time.Trim();
        item.LocationId = request.LocationId;
        item.ComboId = request.ComboId;
        item.RoadmapLocationIds = request.RoadmapLocationIds.Select(ObjectId.Parse).ToList();
        item.Status = DateEventStatus.Reschedule;
        item.UpdatedAt = UtcClock.Next(revision);

        var updated = await db.DateEvents.ReplaceOneAsync(
            x => x.Id == id && x.UpdatedAt == revision, item, cancellationToken: ct);
        if (updated.ModifiedCount == 0)
            return Conflict(new { message = "Lịch hẹn vừa được sửa ở nơi khác. Hãy tải lại." });

        var sent = await TrySendAsync(item, request.Reason.Trim(), ct);
        return StatusCode(sent ? StatusCodes.Status200OK : StatusCodes.Status202Accepted,
            new { dateEvent = item, emailSent = sent });
    }

    [Authorize]
    [HttpPost("{id}/resend")]
    public async Task<IActionResult> Resend(string id, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        var item = await db.DateEvents.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (item is null) return NotFound();
        if (item.Status is not (DateEventStatus.Pending or DateEventStatus.Reschedule))
            return Conflict(new { message = "Chỉ có thể gửi lại lời mời đang chờ phản hồi." });
        var reason = item.Status == DateEventStatus.Reschedule ? item.EditHistory.LastOrDefault()?.Reason : null;
        var sent = await TrySendAsync(item, reason, ct);
        return sent ? Ok(new { emailSent = true }) : StatusCode(503, new { emailSent = false });
    }

    [Authorize]
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(string id, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        var update = Builders<DateEvent>.Update
            .Set(x => x.Status, DateEventStatus.Completed)
            .Set(x => x.UpdatedAt, UtcClock.Now());
        var result = await db.DateEvents.UpdateOneAsync(
            x => x.Id == id && x.Status == DateEventStatus.Accepted, update, cancellationToken: ct);
        if (result.ModifiedCount == 1) return NoContent();
        return Conflict(new { message = "Chỉ có thể hoàn thành lịch hẹn đã được duyệt." });
    }

    [HttpPut("{id}/memories")]
    public async Task<IActionResult> UpdateMemories(string id, [FromBody] UpdateMemoriesRequest request, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _)) return BadRequest(new { message = "ID không hợp lệ." });
        if (request.Photos.Count > 30 || request.Photos.Any(x =>
            !Uri.TryCreate(x, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
            return BadRequest(new { message = "Tối đa 30 ảnh với URL HTTP(S) hợp lệ." });

        var update = Builders<DateEvent>.Update
            .Set(x => x.Memories.Photos, request.Photos.Distinct().ToList())
            .Set(x => x.Memories.ReviewText, request.ReviewText.Trim())
            .Set(x => x.Memories.Emoji, request.Emoji.Trim())
            .Set(x => x.UpdatedAt, UtcClock.Now());
        var result = await db.DateEvents.UpdateOneAsync(
            x => x.Id == id && x.Status == DateEventStatus.Completed, update, cancellationToken: ct);
        if (result.MatchedCount == 0)
            return Conflict(new { message = "Chỉ có thể ghi kỷ niệm cho buổi hẹn đã hoàn thành." });
        var item = await db.DateEvents.Find(x => x.Id == id).FirstAsync(ct);
        return Ok(item);
    }

    private DateEvent BuildEvent(CreateDateEventRequest request, DateEventStatus status)
    {
        var now = UtcClock.Now();
        return new DateEvent
        {
            Id = ObjectId.GenerateNewId().ToString(),
            InviterName = request.InviterName.Trim(),
            Date = NormalizeDate(request.Date),
            Time = request.Time.Trim(),
            PickupLocation = request.PickupLocation?.Trim() ?? string.Empty,
            Dresscode = request.Dresscode.Trim(),
            Message = request.Message.Trim(),
            LocationId = request.LocationId,
            ComboId = request.ComboId,
            RoadmapLocationIds = request.RoadmapLocationIds.Select(ObjectId.Parse).ToList(),
            AppliedVouchers = request.AppliedVouchers.Distinct().Select(ObjectId.Parse).ToList(),
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private async Task<string?> ValidateDraftAsync(
        DateTime date, string time, string? locationId, string? comboId,
        IReadOnlyCollection<string> roadmapLocationIds, IReadOnlyCollection<string> voucherIds, CancellationToken ct)
    {
        if (date == default || date.Date < DateTime.UtcNow.AddHours(7).Date)
            return "Ngày hẹn phải từ hôm nay trở đi.";
        if (!TimeOnly.TryParseExact(time, "HH:mm", CultureInfo.InvariantCulture,
                DateTimeStyles.None, out _))
            return "Giờ hẹn phải theo định dạng HH:mm.";
        var choiceCount = (string.IsNullOrWhiteSpace(locationId) ? 0 : 1) +
            (string.IsNullOrWhiteSpace(comboId) ? 0 : 1) + (roadmapLocationIds.Count > 0 ? 1 : 0);
        if (choiceCount != 1)
            return "Chọn đúng một địa điểm, combo hoặc lộ trình.";

        if (!string.IsNullOrWhiteSpace(locationId))
        {
            if (!ObjectId.TryParse(locationId, out _)) return "LocationId không hợp lệ.";
            if (!await db.Locations.Find(x => x.Id == locationId).AnyAsync(ct))
                return "Địa điểm không tồn tại.";
        }
        if (!string.IsNullOrWhiteSpace(comboId))
        {
            if (!ObjectId.TryParse(comboId, out _)) return "ComboId không hợp lệ.";
            if (!await db.ComboDates.Find(x => x.Id == comboId).AnyAsync(ct))
                return "Combo không tồn tại.";
        }

        if (roadmapLocationIds.Count > 0)
        {
            if (roadmapLocationIds.Count > 10 || roadmapLocationIds.Distinct().Count() != roadmapLocationIds.Count ||
                roadmapLocationIds.Any(x => !ObjectId.TryParse(x, out _)))
                return "Lộ trình cần 1–10 địa điểm hợp lệ, không lặp lại.";
            var count = await db.Locations.CountDocumentsAsync(
                Builders<Location>.Filter.In(x => x.Id, roadmapLocationIds), cancellationToken: ct);
            if (count != roadmapLocationIds.Count) return "Một hoặc nhiều địa điểm trong lộ trình không tồn tại.";
        }

        if (voucherIds.Count > 10 || voucherIds.Any(x => !ObjectId.TryParse(x, out _)))
            return "Danh sách voucher không hợp lệ.";
        var uniqueIds = voucherIds.Distinct().ToList();
        if (uniqueIds.Count > 0)
        {
            var count = await db.Vouchers.CountDocumentsAsync(
                Builders<Voucher>.Filter.In(x => x.Id, uniqueIds), cancellationToken: ct);
            if (count != uniqueIds.Count) return "Một hoặc nhiều voucher không tồn tại.";
        }
        return null;
    }

    private async Task<bool> TrySendAsync(DateEvent item, string? reason, CancellationToken ct)
    {
        try
        {
            await email.SendInvitationAsync(item, reason, ct);
            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send invitation email for event {EventId}", item.Id);
            return false;
        }
    }

    private static DateTime NormalizeDate(DateTime value) =>
        DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);
}
