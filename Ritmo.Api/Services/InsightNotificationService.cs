using Microsoft.EntityFrameworkCore;
using Ritmo.Api.Data;
using Ritmo.Api.Models;

namespace Ritmo.Api.Services;

public class InsightNotificationService
{
    private const decimal ToleranciaManutencaoPeso = 0.5m;
    private readonly AppDbContext _context;

    public InsightNotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task GerarAvisoPerfilAtualizadoAsync(int usuarioId)
    {
        if (!await UsuarioRecebeNotificacoes(usuarioId))
        {
            return;
        }

        await AdicionarInsightDoDiaSeAindaNaoExiste(
            usuarioId,
            "Conta",
            "info",
            "Seu perfil foi atualizado com sucesso. Confira se nome, email e dados demográficos estão corretos.");
        await _context.SaveChangesAsync();
    }

    public async Task GerarAvisoSenhaAtualizadaAsync(int usuarioId)
    {
        if (!await UsuarioRecebeNotificacoes(usuarioId))
        {
            return;
        }

        await AdicionarInsightDoDiaSeAindaNaoExiste(
            usuarioId,
            "Segurança",
            "atencao",
            "Sua senha foi alterada. Se não foi você, troque a senha novamente e revise sua conta.");
        await _context.SaveChangesAsync();
    }

    public async Task GerarAvisosDeProgressoAsync(int usuarioId, bool? imcEstavaSaudavelAntes = null)
    {
        if (!await UsuarioRecebeNotificacoes(usuarioId))
        {
            return;
        }

        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var inicioJanela = hoje.AddDays(-6);
        var metasAtivas = await _context.Metas
            .Where(meta =>
                meta.UsuarioId == usuarioId &&
                meta.Ativa &&
                meta.DataInicio <= hoje &&
                (!meta.DataFim.HasValue || meta.DataFim.Value >= hoje))
            .ToListAsync();

        if (metasAtivas.Count == 0)
        {
            await GerarAvisoPesoSaudavelAsync(usuarioId, imcEstavaSaudavelAntes);
            await _context.SaveChangesAsync();
            return;
        }

        var registrosRecentes = await _context.RegistrosDiarios
            .Where(registro =>
                registro.UsuarioId == usuarioId &&
                registro.Data >= inicioJanela &&
                registro.Data <= hoje)
            .OrderBy(registro => registro.Data)
            .ToListAsync();

        foreach (var meta in metasAtivas.Where(meta => meta.Categoria != "Peso"))
        {
            var valorAtual = CalcularValorAtualDaMeta(meta, registrosRecentes);

            if (!valorAtual.HasValue || valorAtual.Value < meta.ValorAlvo)
            {
                continue;
            }

            var mensagem = MontarMensagemMetaHabito(meta, valorAtual.Value);
            await AdicionarInsightDoDiaSeAindaNaoExiste(usuarioId, "Meta", "positivo", mensagem);
        }

        await GerarAvisosPesoAsync(usuarioId, metasAtivas.Where(meta => meta.Categoria == "Peso").ToList());
        await GerarAvisoPesoSaudavelAsync(usuarioId, imcEstavaSaudavelAntes);
        await _context.SaveChangesAsync();
    }

    private async Task<bool> UsuarioRecebeNotificacoes(int usuarioId)
    {
        var config = await _context.ConfiguracoesPerfil
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UsuarioId == usuarioId);

        return config?.ReceberNotificacoes ?? true;
    }

    private static decimal? CalcularValorAtualDaMeta(Meta meta, IReadOnlyCollection<RegistroDiario> registrosRecentes)
    {
        if (registrosRecentes.Count == 0)
        {
            return null;
        }

        return meta.Categoria switch
        {
            "Sono" => registrosRecentes.Average(registro => registro.Sono),
            "Agua" => registrosRecentes.Average(registro => registro.Agua),
            "Humor" => registrosRecentes.Average(registro => (decimal)registro.Humor),
            "Produtividade" => registrosRecentes.Average(registro => (decimal)registro.Produtividade),
            "Energia" => registrosRecentes.Average(registro => (decimal)registro.Energia),
            "Treino" => registrosRecentes.Count(registro => registro.Exercicio),
            _ => null
        };
    }

    private static string MontarMensagemMetaHabito(Meta meta, decimal valorAtual)
    {
        var categoria = ObterLabelCategoria(meta.Categoria);
        var unidade = ObterUnidadeCategoria(meta.Categoria);
        var valorAtualTexto = FormatarDecimal(valorAtual);
        var alvoTexto = FormatarDecimal(meta.ValorAlvo);

        return meta.Categoria == "Treino"
            ? $"Meta de {categoria} atingida: {valorAtualTexto} dia(s) com treino nos últimos 7 dias, alvo {alvoTexto}."
            : $"Meta de {categoria} atingida: média de {valorAtualTexto}{unidade} nos últimos 7 dias, alvo {alvoTexto}{unidade}.";
    }

    private async Task GerarAvisosPesoAsync(int usuarioId, IReadOnlyCollection<Meta> metasPeso)
    {
        if (metasPeso.Count == 0)
        {
            return;
        }

        var medidasOrdenadas = await _context.MedidasBiometricas
            .Where(medida => medida.UsuarioId == usuarioId)
            .OrderBy(medida => medida.Data)
            .ThenBy(medida => medida.Id)
            .ToListAsync();

        if (medidasOrdenadas.Count == 0)
        {
            return;
        }

        var pesoAtual = medidasOrdenadas[^1].Peso;

        foreach (var meta in metasPeso)
        {
            if (!MetaPesoFoiAtingida(meta, medidasOrdenadas, pesoAtual))
            {
                continue;
            }

            var direcaoTexto = meta.Direcao switch
            {
                "reduzir" => "redução",
                "ganhar" => "ganho",
                "manter" => "manutenção",
                _ => "peso"
            };
            var mensagem =
                $"Meta de peso atingida: objetivo de {direcaoTexto} chegou ao alvo de {FormatarDecimal(meta.ValorAlvo)} kg.";

            await AdicionarInsightDoDiaSeAindaNaoExiste(usuarioId, "Meta", "positivo", mensagem);
        }
    }

    private static bool MetaPesoFoiAtingida(Meta meta, IReadOnlyList<MedidaBiometrica> medidasOrdenadas, decimal pesoAtual)
    {
        var pesoMeta = meta.ValorAlvo;
        var direcao = ObterDirecaoPeso(meta, medidasOrdenadas, pesoAtual);

        return direcao switch
        {
            "reduzir" => pesoAtual <= pesoMeta,
            "ganhar" => pesoAtual >= pesoMeta,
            "manter" => Math.Abs(pesoAtual - pesoMeta) <= ToleranciaManutencaoPeso,
            _ => false
        };
    }

    private static string ObterDirecaoPeso(Meta meta, IReadOnlyList<MedidaBiometrica> medidasOrdenadas, decimal pesoAtual)
    {
        var direcaoPersistida = meta.Direcao?.Trim().ToLowerInvariant();

        if (direcaoPersistida is "reduzir" or "ganhar" or "manter")
        {
            return direcaoPersistida;
        }

        var dataInicio = meta.DataInicio.ToDateTime(TimeOnly.MinValue);
        var medidasAteInicio = medidasOrdenadas
            .Where(medida => medida.Data.Date <= dataInicio.Date)
            .ToList();
        var baseline = medidasAteInicio.LastOrDefault()
            ?? medidasOrdenadas.FirstOrDefault(medida => medida.Data.Date >= dataInicio.Date)
            ?? medidasOrdenadas[0];

        if (baseline.Peso > meta.ValorAlvo || pesoAtual < meta.ValorAlvo)
        {
            return "reduzir";
        }

        if (baseline.Peso < meta.ValorAlvo || pesoAtual > meta.ValorAlvo)
        {
            return "ganhar";
        }

        return "manter";
    }

    private async Task GerarAvisoPesoSaudavelAsync(int usuarioId, bool? imcEstavaSaudavelAntes = null)
    {
        var medidaAtual = await _context.MedidasBiometricas
            .Include(medida => medida.Usuario)
            .Where(medida => medida.UsuarioId == usuarioId)
            .OrderByDescending(medida => medida.Data)
            .ThenByDescending(medida => medida.Id)
            .FirstOrDefaultAsync();

        if (medidaAtual == null || medidaAtual.Altura <= 0 || medidaAtual.Usuario == null)
        {
            return;
        }

        var imc = ImcClassifier.Calcular(medidaAtual.Peso, medidaAtual.Altura);
        var idade = ImcClassifier.CalcularIdade(medidaAtual.Usuario.DataNascimento);
        var classificacaoImc = ImcClassifier.Classificar(imc, idade);

        if (!classificacaoImc.Saudavel)
        {
            return;
        }

        if (imcEstavaSaudavelAntes == true)
        {
            return;
        }

        var faixa = classificacaoImc.Classificacao == "Peso adequado" ? "adequada" : "saudável";
        var prefixoDedupe = "Você chegou na faixa de peso";
        var mensagem =
            $"{prefixoDedupe} {faixa} pelo IMC: {FormatarDecimal(imc)} ({classificacaoImc.Classificacao}).";
        await AdicionarInsightDoDiaSeAindaNaoExiste(
            usuarioId,
            "Peso",
            "positivo",
            mensagem,
            prefixoDedupe,
            deduplicarApenasNaoLidos: imcEstavaSaudavelAntes == false);
    }

    private async Task AdicionarInsightDoDiaSeAindaNaoExiste(
        int usuarioId,
        string categoria,
        string nivel,
        string mensagem,
        string? prefixoDedupe = null,
        bool deduplicarApenasNaoLidos = false)
    {
        var inicioDoDiaUtc = DateTime.UtcNow.Date;
        var insightsDoDia = _context.Insights.Where(insight =>
            insight.UsuarioId == usuarioId &&
            insight.Categoria == categoria &&
            insight.DataGeracao >= inicioDoDiaUtc);

        if (deduplicarApenasNaoLidos)
        {
            insightsDoDia = insightsDoDia.Where(insight => !insight.Lido);
        }

        var jaExisteHoje = prefixoDedupe == null
            ? await insightsDoDia.AnyAsync(insight => insight.Mensagem == mensagem)
            : await insightsDoDia.AnyAsync(insight => insight.Mensagem.StartsWith(prefixoDedupe));

        if (jaExisteHoje)
        {
            return;
        }

        _context.Insights.Add(new Insight
        {
            UsuarioId = usuarioId,
            Categoria = categoria,
            Nivel = nivel,
            Mensagem = mensagem,
            DataGeracao = DateTime.UtcNow,
            Lido = false
        });
    }

    private static string ObterLabelCategoria(string categoria) => categoria switch
    {
        "Agua" => "hidratação",
        "Sono" => "sono",
        "Humor" => "humor",
        "Produtividade" => "produtividade",
        "Energia" => "energia",
        "Treino" => "treino",
        "Peso" => "peso",
        _ => categoria
    };

    private static string ObterUnidadeCategoria(string categoria) => categoria switch
    {
        "Sono" => " h",
        "Agua" => " L",
        _ => ""
    };

    private static string FormatarDecimal(decimal valor) =>
        valor.ToString("0.#", System.Globalization.CultureInfo.GetCultureInfo("pt-BR"));
}
