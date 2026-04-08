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
public class RegistrosDiariosController : ControllerBase
{
    private readonly RegistroDiarioService _service;
    private readonly AppDbContext _context;

    public RegistrosDiariosController(RegistroDiarioService service, AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RegistroDiarioResponse>>> GetRegistros()
    {
        var userId = User.GetAuthenticatedUserId();
        if (userId == null)
            return Unauthorized(new { mensagem = "Usuário autenticado inválido." });

        return Ok(await _service.ListarPorUsuario(userId.Value));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RegistroDiarioResponse>> GetRegistro(int id)
    {
        var registro = await _service.BuscarPorId(id);
        if (registro == null)
            return NotFound(new { mensagem = $"Registro com ID {id} não encontrado." });

        if (registro.UsuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        return Ok(registro);
    }

    [HttpGet("usuario/{usuarioId}")]
    public async Task<ActionResult<IEnumerable<RegistroDiarioResponse>>> GetRegistrosPorUsuario(int usuarioId)
    {
        if (usuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        return Ok(await _service.ListarPorUsuario(usuarioId));
    }

    [HttpPost]
    public async Task<ActionResult<RegistroDiarioResponse>> PostRegistro(RegistroDiarioRequest registro)
    {
        if (registro.UsuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        var result = await _service.UpsertRegistro(registro);
        return CreatedAtAction(nameof(GetRegistro), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutRegistro(int id, RegistroDiarioRequest registro)
    {
        var ownerId = await _context.RegistrosDiarios
            .Where(r => r.Id == id)
            .Select(r => (int?)r.UsuarioId)
            .FirstOrDefaultAsync();

        if (ownerId == null)
            return NotFound(new { mensagem = $"Registro com ID {id} não encontrado." });

        if (ownerId != User.GetAuthenticatedUserId() || registro.UsuarioId != ownerId)
            return Forbid();

        var sucesso = await _service.Atualizar(id, registro);
        if (!sucesso)
            return NotFound(new { mensagem = $"Registro com ID {id} não encontrado." });

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRegistro(int id)
    {
        var ownerId = await _context.RegistrosDiarios
            .Where(r => r.Id == id)
            .Select(r => (int?)r.UsuarioId)
            .FirstOrDefaultAsync();

        if (ownerId == null)
            return NotFound(new { mensagem = $"Registro com ID {id} não encontrado." });

        if (ownerId != User.GetAuthenticatedUserId())
            return Forbid();

        var sucesso = await _service.Deletar(id);
        if (!sucesso)
            return NotFound(new { mensagem = $"Registro com ID {id} não encontrado." });

        return NoContent();
    }
}
