namespace CuteDatingScheduler.Api.Services;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 1025;
    public string From { get; init; } = "Twinkle Twinkle <twinkle@example.local>";
    public string To { get; init; } = "princess@example.local";
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public bool EnableSsl { get; init; }
    public string PublicApiBaseUrl { get; init; } = "http://localhost:5000";
}
