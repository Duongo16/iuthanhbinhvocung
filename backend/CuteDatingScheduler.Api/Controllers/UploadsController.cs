using Microsoft.AspNetCore.Mvc;

namespace CuteDatingScheduler.Api.Controllers;

[ApiController]
[Route("api/uploads")]
public sealed class UploadsController : ControllerBase
{
    private const long MaxImageBytes = 5 * 1024 * 1024;
    private readonly IWebHostEnvironment environment;

    public UploadsController(IWebHostEnvironment environment) => this.environment = environment;

    [HttpPost("image")]
    [RequestSizeLimit(MaxImageBytes + 1024 * 1024)]
    public async Task<IActionResult> Image([FromForm] IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0 || file.Length > MaxImageBytes)
            return BadRequest(new { message = "Ảnh phải nhỏ hơn 5 MB." });

        await using var input = file.OpenReadStream();
        var header = new byte[12];
        var read = await input.ReadAsync(header, ct);
        var extension = DetectImageExtension(header, read);
        if (extension is null)
            return BadRequest(new { message = "Chỉ nhận ảnh JPEG, PNG hoặc WebP." });

        var uploadDirectory = Path.Combine(environment.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadDirectory);
        var fileName = $"{Guid.NewGuid():N}.{extension}";
        var path = Path.Combine(uploadDirectory, fileName);
        await using (var output = System.IO.File.Create(path))
        {
            await output.WriteAsync(header.AsMemory(0, read), ct);
            await input.CopyToAsync(output, ct);
        }

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        return Created(url, new { url });
    }

    private static string? DetectImageExtension(byte[] bytes, int count)
    {
        if (count >= 8 && bytes.AsSpan(0, 8).SequenceEqual(
                new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "png";
        if (count >= 3 && bytes[0] == 255 && bytes[1] == 216 && bytes[2] == 255) return "jpg";
        if (count >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
            bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return "webp";
        return null;
    }
}
