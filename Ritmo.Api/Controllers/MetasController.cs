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
public class MetasController : ControllerBase
{
    private readonly MetaService _metaService;
    private readonly AppDbContext _context;

    public MetasController(MetaService metaService, AppDbContext context)
    {
        _metaService = metaService;
        _context = context;
    }

    [HttpGet("usuario/{usuarioId}")]
    public async Task<ActionResult<IEnumerable<MetaDTO>>> GetMetasPorUsuario(int usuarioId)
    {
        if (usuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        var metas = await _metaService.ListarPorUsuario(usuarioId);
        return Ok(metas);
    }

    [HttpPost]
    public async Task<ActionResult<MetaDTO>> PostMeta(MetaDTO dto)
    {
        if (dto.UsuarioId != User.GetAuthenticatedUserId())
            return Forbid();

        var novaMeta = await _metaService.Criar(dto);
        return CreatedAtAction(nameof(GetMetasPorUsuario), new { usuarioId = novaMeta.UsuarioId }, novaMeta);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutMeta(int id, MetaDTO dto)
    {
        if (id != dto.Id) return BadRequest();
        var ownerId = await _context.Metas
            .Where(m => m.Id == id)
            .Select(m => (int?)m.UsuarioId)
            .FirstOrDefaultAsync();

        if (ownerId == null) return NotFound();
        if (ownerId != User.GetAuthenticatedUserId() || dto.UsuarioId != ownerId) return Forbid();
        
        var sucesso = await _metaService.Atualizar(id, dto);
        if (!sucesso) return NotFound();
        
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMeta(int id)
    {
        var ownerId = await _context.Metas
            .Where(m => m.Id == id)
            .Select(m => (int?)m.UsuarioId)
            .FirstOrDefaultAsync();

        if (ownerId == null) return NotFound();
        if (ownerId != User.GetAuthenticatedUserId()) return Forbid();

        var sucesso = await _metaService.Deletar(id);
        if (!sucesso) return NotFound();
        
        return NoContent();
    }
}
