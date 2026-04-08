using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ritmo.Api.Data;
using Ritmo.Api.DTOs;
using Ritmo.Api.Security;
using Ritmo.Api.Services;

namespace Ritmo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BiometriaController : ControllerBase
{
    private readonly BiometriaService _biometriaService;
    private readonly AppDbContext _context;

    public BiometriaController(BiometriaService biometriaService, AppDbContext context)
    {
        _biometriaService = biometriaService;
        _context = context;
    }

    // GET: api/Biometria/usuario/1
    [HttpGet("usuario/{usuarioId}")]
    public async Task<ActionResult<IEnumerable<MedidaBiometricaResponse>>> GetPorUsuario(int usuarioId)
    {
        if (usuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        var medidas = await _biometriaService.ListarPorUsuario(usuarioId);
        return Ok(medidas);
    }

    // POST: api/Biometria
    [HttpPost]
    public async Task<ActionResult<MedidaBiometricaResponse>> PostMedida(MedidaBiometricaRequest request)
    {
        if (request.UsuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        var novaMedida = await _biometriaService.Registrar(request);
        return CreatedAtAction(nameof(GetPorUsuario), new { usuarioId = novaMedida.UsuarioId }, novaMedida);
    }

    // DELETE: api/Biometria/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMedida(int id)
    {
        var ownerId = await _context.MedidasBiometricas
            .Where(m => m.Id == id)
            .Select(m => (int?)m.UsuarioId)
            .FirstOrDefaultAsync();

        if (ownerId == null) return NotFound();
        if (ownerId != User.GetAuthenticatedUserId()) return Forbid();

        var sucesso = await _biometriaService.Deletar(id);
        if (!sucesso) return NotFound();

        return NoContent();
    }
}
