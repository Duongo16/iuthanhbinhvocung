using System.Globalization;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Encodings.Web;
using CuteDatingScheduler.Api.Models;
using Microsoft.Extensions.Options;

namespace CuteDatingScheduler.Api.Services;

public sealed class SmtpEmailService : IEmailService
{
    private readonly EmailSettings settings;
    private readonly RsvpTokenService tokens;

    public SmtpEmailService(IOptions<EmailSettings> options, RsvpTokenService tokens)
    {
        settings = options.Value;
        this.tokens = tokens;
    }

    public async Task SendInvitationAsync(
        DateEvent dateEvent,
        string? editReason,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dateEvent.Id))
            throw new InvalidOperationException("Cannot email an event without an ID.");

        var token = tokens.Create(dateEvent.Id, dateEvent.UpdatedAt);
        var baseUrl = settings.PublicApiBaseUrl.TrimEnd('/');
        var acceptUrl = $"{baseUrl}/api/rsvp/confirm?token={Uri.EscapeDataString(token)}&decision=accept";
        var rescheduleUrl = $"{baseUrl}/api/rsvp/confirm?token={Uri.EscapeDataString(token)}&decision=reschedule";
        var title = editReason is null ? "Một lời hẹn hò mới 💌" : "Lịch hẹn đã đổi ✨";
        var safeTitle = HtmlEncoder.Default.Encode(title);
        var safeInviter = HtmlEncoder.Default.Encode(dateEvent.InviterName);
        var safeMessage = HtmlEncoder.Default.Encode(dateEvent.Message);
        var safeDresscode = HtmlEncoder.Default.Encode(dateEvent.Dresscode);
        var pickupLine = string.IsNullOrWhiteSpace(dateEvent.PickupLocation) ? string.Empty :
            $"<br>📍 Điểm đón: {HtmlEncoder.Default.Encode(dateEvent.PickupLocation)}";
        var roadmapLine = dateEvent.RoadmapLocationIds.Count > 0 ?
            $"<br>🗺️ Lộ trình: {dateEvent.RoadmapLocationIds.Count} điểm dừng" : string.Empty;
        var when = HtmlEncoder.Default.Encode(
            $"{dateEvent.Date.ToString("dd/MM/yyyy", CultureInfo.GetCultureInfo("vi-VN"))} · {dateEvent.Time}");
        var reasonBlock = editReason is null ? string.Empty :
            $"<div style='padding:18px;border-radius:18px;background:#fff1a8;margin:18px 0'>" +
            $"<strong>Lý do đổi lịch:</strong> {HtmlEncoder.Default.Encode(editReason)}</div>";

        var html = $"""
            <!doctype html>
            <html lang="vi">
            <head><meta charset="utf-8"><title>{safeTitle}</title></head>
            <body style="margin:0;padding:32px;background:#dceeff;font-family:Arial,sans-serif;color:#3f3a5a">
              <div style="max-width:560px;margin:auto;padding:34px;border-radius:32px;background:#fff9f2;box-shadow:0 12px 32px #a9a1c455">
                <p style="font-size:24px;text-align:center;margin:0">☁️ ✨ ☁️</p>
                <h1 style="text-align:center;color:#8a6da8">{safeTitle}</h1>
                <p><strong>{safeInviter}</strong> gửi bạn một lời hẹn dưới trời sao.</p>
                <p style="padding:16px;border-radius:18px;background:#ffc8dd">📅 {when}{pickupLine}{roadmapLine}<br>👗 {safeDresscode}</p>
                <p>{safeMessage}</p>
                {reasonBlock}
                <div style="text-align:center;margin-top:28px">
                  <a href="{HtmlEncoder.Default.Encode(acceptUrl)}" style="display:inline-block;margin:5px;padding:14px 20px;border-radius:30px;background:#cdb4db;color:#3f3a5a;text-decoration:none;font-weight:bold">Duyệt luôn 💖</a>
                  <a href="{HtmlEncoder.Default.Encode(rescheduleUrl)}" style="display:inline-block;margin:5px;padding:14px 20px;border-radius:30px;background:#bde0fe;color:#3f3a5a;text-decoration:none;font-weight:bold">Khoan, đổi lịch ☁️</a>
                </div>
                <p style="font-size:12px;text-align:center;color:#7a7496">Liên kết có hiệu lực trong 14 ngày. Bạn sẽ xác nhận ở trang tiếp theo.</p>
              </div>
            </body>
            </html>
            """;

        using var message = new MailMessage
        {
            From = new MailAddress(settings.From),
            Subject = title,
            SubjectEncoding = Encoding.UTF8,
            Body = html,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = true
        };
        message.To.Add(settings.To);

        using var client = new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };
        if (!string.IsNullOrWhiteSpace(settings.Username))
        {
            client.Credentials = new NetworkCredential(settings.Username, settings.Password);
        }

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
    }
}
