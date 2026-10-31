using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CuteDatingScheduler.Api.Contracts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CuteDatingScheduler.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController : ControllerBase
{
    private readonly IConfiguration configuration;

    public AdminAuthController(IConfiguration configuration)
    {
        this.configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var expected = configuration["Admin:Password"];
        if (string.IsNullOrWhiteSpace(expected) || !FixedTimeEquals(request.Password, expected))
            return Unauthorized(new { message = "Mật khẩu chưa đúng." });

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "princess-admin")],
            CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity));
        return Ok(new { authenticated = true });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new { authenticated = true });

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private static bool FixedTimeEquals(string supplied, string expected)
    {
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(supplied));
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        return CryptographicOperations.FixedTimeEquals(suppliedHash, expectedHash);
    }
}
