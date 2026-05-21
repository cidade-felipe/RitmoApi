namespace Ritmo.Api.Services;

public readonly record struct ImcClassification(string Classificacao, string Cor, bool Saudavel);

public static class ImcClassifier
{
    public static decimal Calcular(decimal peso, int alturaCentimetros)
    {
        var alturaMetros = (decimal)alturaCentimetros / 100;
        var imc = alturaMetros > 0 ? peso / (alturaMetros * alturaMetros) : 0;

        return Math.Round(imc, 1);
    }

    public static int CalcularIdade(DateOnly dataNascimento, DateOnly? dataReferencia = null)
    {
        var referencia = dataReferencia ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var idade = referencia.Year - dataNascimento.Year;

        if (referencia.Month < dataNascimento.Month ||
            (referencia.Month == dataNascimento.Month && referencia.Day < dataNascimento.Day))
        {
            idade--;
        }

        return idade;
    }

    public static ImcClassification Classificar(decimal imc, int idade)
    {
        if (imc <= 0)
        {
            return new ImcClassification("Aguardando Dados", "gray", false);
        }

        if (idade >= 65)
        {
            if (imc <= 22m) return new ImcClassification("Baixo peso", "#f1c40f", false);
            if (imc < 27m) return new ImcClassification("Peso adequado", "#2ecc71", true);
            return new ImcClassification("Sobrepeso", "#e67e22", false);
        }

        if (imc < 18.5m) return new ImcClassification("Abaixo do peso", "#f1c40f", false);
        if (imc < 25m) return new ImcClassification("Peso normal", "#2ecc71", true);
        if (imc < 30m) return new ImcClassification("Sobrepeso", "#e67e22", false);
        if (imc < 35m) return new ImcClassification("Obesidade grau I", "#e74c3c", false);
        if (imc < 40m) return new ImcClassification("Obesidade grau II", "#c0392b", false);

        return new ImcClassification("Obesidade grau III", "#900C3F", false);
    }
}
