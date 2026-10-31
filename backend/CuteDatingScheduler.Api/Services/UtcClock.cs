namespace CuteDatingScheduler.Api.Services;

public static class UtcClock
{
    public static DateTime Now()
    {
        var ticks = DateTime.UtcNow.Ticks;
        return new DateTime(ticks - ticks % TimeSpan.TicksPerMillisecond, DateTimeKind.Utc);
    }

    public static DateTime Next(DateTime previous)
    {
        var now = Now();
        return now > previous ? now : previous.AddMilliseconds(1);
    }
}
