using System.Security.Claims;

namespace Ritmo.Api.Security;

public static class UserContextExtensions
{
    public static int? GetAuthenticatedUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out int userId) ? userId : null;
    }
}
