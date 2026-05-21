using System.ComponentModel.DataAnnotations;
using Ritmo.Api.Models;
using Ritmo.Api.Services;

namespace Ritmo.Api.DTOs;

public class MedidaBiometricaRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "UsuarioId deve ser maior que zero.")]
    public int UsuarioId { get; set; }

    [Range(typeof(decimal), "10", "600", ErrorMessage = "Peso deve estar entre 10 e 600 kg.")]
    public decimal Peso { get; set; }

    [Range(50, 280, ErrorMessage = "Altura deve estar entre 50 e 280 cm.")]
    public int Altura { get; set; }

    [Required(ErrorMessage = "Data da medição é obrigatória.")]
    public DateTime Data { get; set; } = DateTime.UtcNow;

    public MedidaBiometrica ToEntity()
    {
        return new MedidaBiometrica
        {
            UsuarioId = this.UsuarioId,
            Peso = this.Peso,
            Altura = this.Altura,
            Data = this.Data
        };
    }
}

public class MedidaBiometricaResponse
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public decimal Peso { get; set; }
    public int Altura { get; set; }
    public decimal IMC { get; set; }
    public DateTime Data { get; set; }
    public string ImcClassificacao { get; set; } = string.Empty;
    public string ImcCor { get; set; } = string.Empty;

    public static MedidaBiometricaResponse FromEntity(MedidaBiometrica entity, DateOnly dataNascimento)
    {
        var imcRounded = ImcClassifier.Calcular(entity.Peso, entity.Altura);
        var idade = ImcClassifier.CalcularIdade(dataNascimento);
        var classificacaoImc = ImcClassifier.Classificar(imcRounded, idade);

        return new MedidaBiometricaResponse
        {
            Id = entity.Id,
            UsuarioId = entity.UsuarioId,
            Peso = entity.Peso,
            Altura = entity.Altura,
            IMC = imcRounded,
            Data = entity.Data,
            ImcClassificacao = classificacaoImc.Classificacao,
            ImcCor = classificacaoImc.Cor
        };
    }
}
