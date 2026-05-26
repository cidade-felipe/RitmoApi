# Roteiro de apresentacao do banco de dados do Ritmo

Este roteiro foi feito para uma apresentacao oral do projeto Ritmo, com foco no banco de dados, nas tabelas, nos relacionamentos e, principalmente, no relacionamento `1:1` entre `Usuarios` e `ConfiguracoesPerfil`.

Data do roteiro: 26/05/2026

## 1. Ideia principal da apresentacao

Fala pronta:

> O banco de dados do Ritmo foi modelado com a tabela `Usuarios` como entidade central. A partir dela, o sistema relaciona os dados diarios de rotina, as medidas biometricas, as metas, os insights e as configuracoes de perfil. A maior parte desses relacionamentos e `1:N`, porque um usuario pode ter varios registros ao longo do tempo. A excecao principal e `Usuarios` com `ConfiguracoesPerfil`, que e `1:1`, porque cada usuario deve ter exatamente um conjunto de preferencias de interface e comunicacao.

Mensagem que voce quer deixar clara para a banca:

O modelo nao foi feito apenas para guardar dados. Ele tambem protege regras importantes do produto, como email unico, um registro diario por data, uma biometria por dia e uma configuracao de perfil por usuario.

## 2. Base verificavel no codigo

| Ponto | Onde aparece |
|---|---|
| Banco relacional com Entity Framework Core | `Ritmo.Api/Data/AppDbContext.cs` |
| Entidades principais | `Ritmo.Api/Models/*.cs` |
| Mapeamento final do EF Core | `Ritmo.Api/Migrations/AppDbContextModelSnapshot.cs` |
| Relacionamento `1:1` de perfil | `AppDbContext.OnModelCreating` |
| Indices unicos | `AppDbContext.OnModelCreating` e migrations |
| Criacao automatica da configuracao de perfil | `UsuarioService.Criar`, usando `ConfiguracaoPerfil = new ConfiguracaoPerfil()` |

## 3. Visao geral do banco

Fato:

O projeto usa PostgreSQL como banco relacional, acessado pelo backend ASP.NET Core por meio do Entity Framework Core e do provider Npgsql.

Entidades de dominio:

| Tabela | Papel no sistema |
|---|---|
| `Usuarios` | Guarda a identidade do usuario, dados de login e dados demograficos basicos. |
| `RegistrosDiarios` | Guarda o registro de rotina de cada dia, como humor, sono, energia, produtividade, exercicio, agua e observacoes. |
| `MedidasBiometricas` | Guarda historico de peso e altura, usado para calculo de IMC e acompanhamento corporal. |
| `Metas` | Guarda objetivos do usuario, como sono, agua, energia, produtividade, treino ou peso. |
| `Insights` | Guarda notificacoes e avisos gerados pelo sistema para o usuario. |
| `ConfiguracoesPerfil` | Guarda preferencias individuais de interface, idioma, fuso horario e comunicacao. |

Tabela tecnica:

| Tabela | Explicacao |
|---|---|
| `__EFMigrationsHistory` | Tabela interna do Entity Framework Core. Ela registra quais migrations ja foram aplicadas no banco. Nao e uma entidade de negocio do Ritmo. |

Fala pronta:

> Se aparecer a tabela `__EFMigrationsHistory` no diagrama, ela nao representa uma funcionalidade do sistema. Ela e criada pelo Entity Framework para controlar a evolucao do schema do banco.

## 4. Diagrama relacional simplificado

```mermaid
erDiagram
    USUARIOS ||--|| CONFIGURACOES_PERFIL : possui
    USUARIOS ||--o{ REGISTROS_DIARIOS : registra
    USUARIOS ||--o{ MEDIDAS_BIOMETRICAS : registra
    USUARIOS ||--o{ METAS : define
    USUARIOS ||--o{ INSIGHTS : recebe

    USUARIOS {
        int Id PK
        text Nome
        text Email UK
        text Senha
        timestamp DataCriacao
        date DataNascimento
        text Sexo
    }

    CONFIGURACOES_PERFIL {
        int Id PK
        int UsuarioId FK_UK
        boolean TemaEscuro
        text Idioma
        text FusoHorario
        boolean ExibirMetaNoDashboard
        boolean ReceberNotificacoes
        boolean ReceberRelatorioSemanal
    }

    REGISTROS_DIARIOS {
        int Id PK
        int UsuarioId FK
        date Data
        int Humor
        numeric Sono
        int Produtividade
        int Energia
        boolean Exercicio
        numeric Agua
        text Observacoes
        timestamp DataCriacao
    }

    MEDIDAS_BIOMETRICAS {
        int Id PK
        int UsuarioId FK
        numeric Peso
        int Altura
        timestamp Data
        date DataDia UK
    }

    METAS {
        int Id PK
        int UsuarioId FK
        text Categoria
        numeric ValorAlvo
        text Direcao
        numeric ValorInicial
        text Descricao
        date DataInicio
        date DataFim
        boolean Ativa
        timestamp DataCriacao
    }

    INSIGHTS {
        int Id PK
        int UsuarioId FK
        text Mensagem
        text Categoria
        text Nivel
        timestamp DataGeracao
        boolean Lido
    }
```

Observacao para a apresentacao:

`UK` significa chave unica. No diagrama, `Email` e unico em `Usuarios`, `UsuarioId` e unico em `ConfiguracoesPerfil`, e a unicidade diaria de biometria acontece pelo par `UsuarioId + DataDia`.

## 5. Explicacao tabela por tabela

### 5.1. `Usuarios`

Fato:

`Usuarios` e a tabela central do sistema.

Campos principais:

| Campo | Funcao |
|---|---|
| `Id` | Chave primaria. Identifica o usuario no banco. |
| `Nome` | Nome completo exibido no sistema. |
| `Email` | Usado no login. Tem indice unico para impedir duplicidade. |
| `Senha` | Armazena o hash da senha, nao a senha em texto puro. |
| `DataCriacao` | Indica quando o usuario foi cadastrado. |
| `DataNascimento` | Usada em regras de perfil e calculo de idade. |
| `Sexo` | Dado demografico usado no perfil. |

Fala pronta:

> A tabela `Usuarios` concentra identidade e autenticacao. Ela nao guarda todo o historico do usuario, porque isso criaria uma tabela grande demais e misturaria responsabilidades diferentes.

### 5.2. `RegistrosDiarios`

Fato:

Cada linha representa os dados de rotina de um usuario em um dia.

Campos principais:

| Campo | Funcao |
|---|---|
| `UsuarioId` | Chave estrangeira para `Usuarios`. |
| `Data` | Dia do registro. |
| `Humor` | Escala de 1 a 5. |
| `Sono` | Horas de sono. |
| `Produtividade` | Escala de 1 a 5. |
| `Energia` | Escala de 1 a 5. |
| `Exercicio` | Indica se houve treino no dia. |
| `Agua` | Litros de agua consumidos. |
| `Observacoes` | Texto livre do usuario. |

Regra importante:

Existe indice unico em `UsuarioId + Data`. Isso impede que o mesmo usuario tenha dois registros diarios para o mesmo dia.

Fala pronta:

> Essa tabela e `1:N` com usuario, porque um usuario pode registrar muitos dias, mas cada registro diario pertence a um unico usuario.

### 5.3. `MedidasBiometricas`

Fato:

Essa tabela guarda historico corporal do usuario.

Campos principais:

| Campo | Funcao |
|---|---|
| `UsuarioId` | Chave estrangeira para `Usuarios`. |
| `Peso` | Peso registrado em kg. |
| `Altura` | Altura registrada em centimetros. |
| `Data` | Data e hora da medicao. |
| `DataDia` | Coluna computada no banco, derivada de `Data`, usada para unicidade por dia. |

Regra importante:

Existe indice unico em `UsuarioId + DataDia`. Isso permite historico ao longo do tempo, mas evita duas biometricas para o mesmo usuario no mesmo dia.

Fala pronta:

> A biometria nao fica dentro de `Usuarios` porque peso muda com o tempo. Se eu salvasse apenas o peso atual no usuario, perderia o historico e nao conseguiria mostrar evolucao, IMC ao longo do tempo ou metas de peso.

### 5.4. `Metas`

Fato:

Essa tabela guarda os objetivos definidos pelo usuario.

Campos principais:

| Campo | Funcao |
|---|---|
| `UsuarioId` | Chave estrangeira para `Usuarios`. |
| `Categoria` | Tipo de meta, como sono, agua, energia, produtividade, treino ou peso. |
| `ValorAlvo` | Valor que o usuario quer atingir. |
| `Direcao` | Sentido da meta, principalmente em peso, como reduzir, ganhar ou manter. |
| `ValorInicial` | Ponto de partida da meta, usado principalmente em metas de peso. |
| `Descricao` | Texto livre explicando por que a meta importa. |
| `DataInicio` | Inicio da meta. |
| `DataFim` | Fim da meta, quando existir. |
| `Ativa` | Indica se a meta continua ativa. |

Fala pronta:

> `Metas` tambem e `1:N`, porque um usuario pode ter varias metas ativas ou historicas, mas cada meta pertence a um usuario especifico.

### 5.5. `Insights`

Fato:

Essa tabela guarda avisos e notificacoes geradas para o usuario.

Campos principais:

| Campo | Funcao |
|---|---|
| `UsuarioId` | Chave estrangeira para `Usuarios`. |
| `Mensagem` | Texto que sera exibido para o usuario. |
| `Categoria` | Agrupa o tipo do insight. |
| `Nivel` | Classifica o aviso como informativo, positivo ou de atencao. |
| `DataGeracao` | Quando o insight foi criado. |
| `Lido` | Controla se o usuario ja viu ou dispensou o aviso. |

Fala pronta:

> `Insights` funciona como uma caixa de mensagens do sistema. O backend gera os avisos, persiste no banco, e o frontend apenas exibe e permite marcar como lido.

### 5.6. `ConfiguracoesPerfil`

Fato:

Essa tabela guarda as preferencias individuais de cada usuario.

Campos principais:

| Campo | Funcao |
|---|---|
| `UsuarioId` | Chave estrangeira para `Usuarios` e tambem chave unica da relacao `1:1`. |
| `TemaEscuro` | Preferencia visual. |
| `Idioma` | Idioma da interface, hoje `pt-BR`. |
| `FusoHorario` | Fuso horario usado pela aplicacao. |
| `ExibirMetaNoDashboard` | Preferencia de visibilidade de metas. |
| `ReceberNotificacoes` | Preferencia para notificacoes. |
| `ReceberRelatorioSemanal` | Preferencia para relatorios semanais. |

Fala pronta:

> Essa e a tabela mais importante para explicar o `1:1`. Cada usuario tem uma unica configuracao de perfil, e cada configuracao pertence a um unico usuario.

## 6. Relacionamentos do banco

### 6.1. Resumo das cardinalidades

| Relacionamento | Cardinalidade | Motivo |
|---|---:|---|
| `Usuarios` com `ConfiguracoesPerfil` | `1:1` | Um usuario tem um unico conjunto de preferencias. |
| `Usuarios` com `RegistrosDiarios` | `1:N` | Um usuario registra varios dias. |
| `Usuarios` com `MedidasBiometricas` | `1:N` | Um usuario pode ter varias medicoes ao longo do tempo. |
| `Usuarios` com `Metas` | `1:N` | Um usuario pode criar varias metas. |
| `Usuarios` com `Insights` | `1:N` | Um usuario pode receber varios avisos. |

### 6.2. Por que quase tudo e `1:N`

Fala pronta:

> As tabelas de historico sao `1:N` porque o Ritmo acompanha evolucao. Rotina, biometria, metas e insights mudam com o tempo. Entao, nao faria sentido guardar apenas um valor unico dentro de `Usuarios`. O modelo separa o que e identidade do usuario daquilo que e comportamento ou historico.

Impacto pratico:

Essa separacao melhora manutencao, permite filtros por periodo, reduz risco de sobrescrever historico e facilita graficos e relatorios.

## 7. Foco principal: relacionamento `1:1`

### 7.1. Qual e o relacionamento `1:1`

Fato:

O relacionamento `1:1` principal do projeto e:

```text
Usuarios 1:1 ConfiguracoesPerfil
```

Fala pronta:

> O `1:1` aparece entre `Usuarios` e `ConfiguracoesPerfil`. A regra de negocio e simples: cada usuario deve ter uma configuracao de perfil, e uma configuracao de perfil nao pode ser compartilhada por dois usuarios.

### 7.2. Como o `1:1` e garantido no banco

Fato:

No `AppDbContext`, a relacao e mapeada assim:

```csharp
modelBuilder.Entity<Usuario>()
    .HasOne(u => u.ConfiguracaoPerfil)
    .WithOne(c => c.Usuario)
    .HasForeignKey<ConfiguracaoPerfil>(c => c.UsuarioId)
    .OnDelete(DeleteBehavior.Cascade);
```

O `AppDbContextModelSnapshot` confirma que `ConfiguracoesPerfil.UsuarioId` possui indice unico:

```csharp
b.HasIndex("UsuarioId")
    .IsUnique();
```

Traducao para a apresentacao:

| Mecanismo | O que ele garante |
|---|---|
| `ConfiguracoesPerfil.UsuarioId` como FK | Toda configuracao pertence a um usuario existente. |
| Indice unico em `ConfiguracoesPerfil.UsuarioId` | O mesmo usuario nao pode ter duas configuracoes. |
| `.WithOne(...)` no EF Core | O modelo da aplicacao tambem entende a relacao como `1:1`. |
| `Cascade delete` | Ao excluir o usuario, a configuracao dele tambem e removida. |

Fala pronta:

> O ponto tecnico principal e o indice unico em `ConfiguracoesPerfil.UsuarioId`. Sem esse indice, o banco permitiria varias configuracoes para o mesmo usuario, e isso viraria `1:N`. Com a FK e o indice unico juntos, eu garanto que a configuracao pertence a um usuario existente e que aquele usuario so aparece uma vez nessa tabela.

### 7.3. Por que `ConfiguracoesPerfil` nao ficou dentro de `Usuarios`

Opinio tecnica:

Separar `ConfiguracoesPerfil` de `Usuarios` e uma decisao melhor para este projeto.

Motivos:

| Motivo | Explicacao |
|---|---|
| Responsabilidade unica | `Usuarios` cuida de identidade, login e dados basicos. `ConfiguracoesPerfil` cuida de preferencias. |
| Evolucao futura | Novas preferencias podem ser adicionadas sem deixar `Usuarios` cada vez mais inchada. |
| Organizacao do dominio | Configuracao de interface e comunicacao nao tem a mesma natureza que email, senha e nascimento. |
| Manutencao | Fica mais facil alterar regras de preferencias sem mexer na entidade principal de autenticacao. |

Fala pronta:

> Tecnicamente, seria possivel colocar esses campos dentro de `Usuarios`. Mas isso misturaria identidade com preferencias de uso. Como essas preferencias podem crescer, a separacao deixa o modelo mais organizado e sustentavel.

### 7.4. Pergunta provavel: se e `1:1`, precisa mesmo de outra tabela?

Resposta curta:

> Nao e obrigatorio, mas neste caso faz sentido. O `1:1` foi usado para separar dois conceitos diferentes: quem e o usuario e como ele prefere usar o sistema.

Resposta mais completa:

> Em banco relacional, relacoes `1:1` costumam aparecer quando queremos separar responsabilidades, dados opcionais, dados sensiveis ou grupos de campos que evoluem de forma independente. Aqui, a separacao melhora clareza e manutencao. Mesmo que exista uma configuracao por usuario, ela representa outro aspecto do dominio.

### 7.5. Pergunta provavel: a propriedade e nullable no C#, isso quebra o `1:1`?

Fato:

No modelo C#, `Usuario.ConfiguracaoPerfil` aparece como nullable:

```csharp
public ConfiguracaoPerfil? ConfiguracaoPerfil { get; set; }
```

Inferencia tecnica:

Isso nao significa que a regra do banco seja opcional. Em projetos com Entity Framework, propriedades de navegacao podem ser nullable porque nem sempre sao carregadas automaticamente na consulta. A regra relacional e definida pelo mapeamento e pelo banco.

Fala pronta:

> A nulabilidade no C# esta relacionada ao carregamento da navegacao pelo EF. A garantia do `1:1` vem da FK, do indice unico e do mapeamento no `AppDbContext`. Alem disso, quando o usuario e criado, o service ja cria uma `ConfiguracaoPerfil` padrao.

## 8. Integridade e regras protegidas pelo banco

### 8.1. Email unico

Fato:

`Usuarios.Email` tem indice unico.

Impacto:

Evita duas contas com o mesmo email, o que protegeria login, recuperacao de conta e consistencia da autenticacao.

Fala pronta:

> Essa regra nao fica apenas no frontend. O banco tambem protege contra duplicidade de email.

### 8.2. Um registro diario por usuario e data

Fato:

Existe indice unico em:

```text
RegistrosDiarios(UsuarioId, Data)
```

Impacto:

Evita duplicar o mesmo dia no dashboard e torna o comportamento de atualizar o registro diario mais confiavel.

Fala pronta:

> Para cada usuario, o banco permite no maximo um registro diario por data. Isso evita inconsistencia nos graficos e nas medias.

### 8.3. Uma biometria por usuario e dia

Fato:

`MedidasBiometricas.DataDia` e uma coluna computada no PostgreSQL a partir de `Data`.

Existe indice unico em:

```text
MedidasBiometricas(UsuarioId, DataDia)
```

Impacto:

Mesmo que `Data` tenha hora, minuto e segundo, o banco consegue garantir a regra por dia.

Fala pronta:

> A coluna `DataDia` resolve um problema comum: se eu usasse apenas `Data` com hora, o usuario poderia registrar varias biometricas no mesmo dia em horarios diferentes. Com `DataDia`, eu preservo a data completa e ainda garanto unicidade diaria.

### 8.4. Exclusao em cascata

Fato:

Os relacionamentos usam `DeleteBehavior.Cascade`.

Impacto:

Ao excluir um usuario, os dados dependentes dele tambem sao removidos. Isso evita registros orfaos no banco.

Fala pronta:

> Como todas essas tabelas dependem do usuario, a exclusao em cascata evita que fiquem registros soltos, por exemplo metas ou insights apontando para um usuario que nao existe mais.

## 9. Como apresentar o diagrama do banco

Sequencia recomendada:

1. Comece pela tabela `Usuarios`.
2. Mostre que ela e o centro do modelo.
3. Aponte primeiro o `1:1` com `ConfiguracoesPerfil`.
4. Depois mostre as relacoes `1:N`.
5. Finalize com os indices unicos e a tabela tecnica do EF.

Fala pronta para navegar pelo desenho:

> Lendo o diagrama, a tabela `Usuarios` fica no centro. A ligacao com `ConfiguracoesPerfil` e `1:1`. Ja as ligacoes com `RegistrosDiarios`, `MedidasBiometricas`, `Metas` e `Insights` sao `1:N`, porque elas representam historico ou multiplos eventos relacionados ao mesmo usuario.

Se perguntarem sobre a linha pontilhada ou forma visual do diagrama:

> O mais importante aqui e a cardinalidade. A garantia real nao esta no desenho, esta no banco: FK, indice unico e cascade configurados pelo Entity Framework.

## 10. Roteiro de fala de 7 minutos

### 0:00 a 0:40, abertura

> Eu vou apresentar a modelagem do banco do Ritmo. O sistema usa um banco relacional PostgreSQL, acessado pelo backend ASP.NET Core via Entity Framework Core. A ideia central e que `Usuarios` e a entidade principal, e as outras tabelas representam dados ligados a esse usuario.

### 0:40 a 1:40, entidades principais

> As tabelas principais sao `Usuarios`, `RegistrosDiarios`, `MedidasBiometricas`, `Metas`, `Insights` e `ConfiguracoesPerfil`. `Usuarios` guarda identidade e login. `RegistrosDiarios` guarda rotina diaria. `MedidasBiometricas` guarda peso e altura ao longo do tempo. `Metas` guarda objetivos. `Insights` guarda notificacoes. E `ConfiguracoesPerfil` guarda preferencias do usuario.

### 1:40 a 3:00, relacoes `1:N`

> A maioria das relacoes e `1:N`. Um usuario pode ter varios registros diarios, varias medicoes biometricas, varias metas e varios insights. Mas cada um desses registros pertence a um unico usuario. Essa escolha e importante porque o produto trabalha com historico e evolucao.

### 3:00 a 4:40, foco no `1:1`

> O relacionamento `1:1` principal e entre `Usuarios` e `ConfiguracoesPerfil`. Cada usuario tem uma unica configuracao de perfil, e cada configuracao pertence a um unico usuario. No banco, isso e garantido porque `ConfiguracoesPerfil.UsuarioId` e uma chave estrangeira para `Usuarios.Id` e tambem tem indice unico. Entao o banco nao permite duas configuracoes para o mesmo usuario.

### 4:40 a 5:40, por que separar perfil

> Mesmo sendo `1:1`, a configuracao foi separada de `Usuarios` por organizacao. `Usuarios` fica responsavel por identidade, login e dados basicos. `ConfiguracoesPerfil` fica responsavel por preferencias, como tema, idioma, fuso horario e notificacoes. Isso deixa o modelo mais limpo e mais facil de evoluir.

### 5:40 a 6:40, integridade

> O banco tambem protege regras importantes com indices unicos. Email e unico, para evitar duas contas iguais. `RegistrosDiarios` tem unicidade por `UsuarioId` e `Data`, entao um usuario nao duplica o mesmo dia. `MedidasBiometricas` tem unicidade por `UsuarioId` e `DataDia`, que e uma coluna computada para garantir uma biometria por dia.

### 6:40 a 7:00, fechamento

> Entao, a modelagem do banco foi pensada para manter o usuario como centro, preservar historico nas tabelas certas e proteger regras de integridade direto no banco, nao apenas na interface.

## 11. Versao curta, se tiver pouco tempo

> O banco do Ritmo usa `Usuarios` como tabela central. A partir dela, existem relacoes `1:N` com `RegistrosDiarios`, `MedidasBiometricas`, `Metas` e `Insights`, porque esses dados sao historicos ou podem ocorrer varias vezes para o mesmo usuario. O relacionamento `1:1` principal e com `ConfiguracoesPerfil`: cada usuario tem uma configuracao, e cada configuracao pertence a um unico usuario. Isso e garantido por uma FK em `ConfiguracoesPerfil.UsuarioId` e por um indice unico nessa coluna. A separacao existe para nao misturar identidade e autenticacao com preferencias de interface e comunicacao.

## 12. Perguntas provaveis da banca

### Pergunta: Qual e a tabela central do banco?

Resposta:

> `Usuarios`, porque todas as outras entidades principais dependem dela por `UsuarioId`.

### Pergunta: Onde esta o relacionamento `1:1`?

Resposta:

> Entre `Usuarios` e `ConfiguracoesPerfil`.

### Pergunta: Como voces garantem que e `1:1`?

Resposta:

> Com `ConfiguracoesPerfil.UsuarioId` como chave estrangeira para `Usuarios.Id` e com indice unico nessa coluna. A FK garante que a configuracao pertence a um usuario existente, e o indice unico impede mais de uma configuracao para o mesmo usuario.

### Pergunta: Por que nao colocar as configuracoes dentro de `Usuarios`?

Resposta:

> Porque sao responsabilidades diferentes. `Usuarios` representa identidade e autenticacao. `ConfiguracoesPerfil` representa preferencias de uso. Separar deixa o modelo mais limpo e facilita evoluir novas preferencias no futuro.

### Pergunta: `RegistrosDiarios` e `1:N` ou `1:1`?

Resposta:

> E `1:N`. Um usuario pode ter varios registros diarios, mas cada registro pertence a um usuario. A unicidade por dia e garantida pelo indice `UsuarioId + Data`, mas isso nao transforma a relacao em `1:1`, apenas impede duplicidade no mesmo dia.

### Pergunta: `MedidasBiometricas` poderia ser `1:1`?

Resposta:

> Nao para este produto. Como peso e altura podem ser registrados ao longo do tempo, a tabela precisa guardar historico. Por isso ela e `1:N` com `Usuarios`.

### Pergunta: O IMC fica salvo no banco?

Resposta:

> Pelo modelo atual, o banco salva peso, altura e data. O IMC e calculado a partir desses dados na resposta da aplicacao. Isso evita armazenar um valor derivado que poderia ficar inconsistente se peso ou altura mudassem.

### Pergunta: O que acontece se excluir um usuario?

Resposta:

> Os dados dependentes sao removidos em cascata, porque os relacionamentos usam `DeleteBehavior.Cascade`. Isso evita registros orfaos, como metas ou insights sem usuario.

### Pergunta: Qual a diferenca entre `Data` e `DataDia` em `MedidasBiometricas`?

Resposta:

> `Data` guarda o momento da medicao. `DataDia` e uma coluna computada pelo banco, extraida de `Data`, usada para garantir que exista no maximo uma biometria por usuario em cada dia.

### Pergunta: Por que existe `__EFMigrationsHistory` no banco?

Resposta:

> E uma tabela tecnica criada pelo Entity Framework Core para controlar quais migrations ja foram aplicadas. Ela nao representa uma regra de negocio do Ritmo.

## 13. Pontos de cuidado para nao se enrolar

Nao diga:

> O banco tem apenas relacionamento `1:1`.

Diga:

> O banco tem um relacionamento `1:1` importante, entre `Usuarios` e `ConfiguracoesPerfil`, e varias relacoes `1:N`.

Nao diga:

> `RegistrosDiarios` e `1:1` porque so pode ter um por dia.

Diga:

> `RegistrosDiarios` e `1:N` com usuario. A regra de um por dia e uma restricao unica adicional em `UsuarioId + Data`.

Nao diga:

> `MedidasBiometricas` guarda o IMC.

Diga:

> `MedidasBiometricas` guarda peso e altura. O IMC e calculado a partir desses dados.

Nao diga:

> `ConfiguracoesPerfil.UsuarioId` e chave primaria.

Diga:

> `ConfiguracoesPerfil.Id` e chave primaria. `UsuarioId` e uma chave estrangeira com indice unico, e isso garante o `1:1`.

## 14. Checklist antes de apresentar

Confira se voce consegue responder sem olhar:

- Qual e a tabela central?
- Quais tabelas sao `1:N` com `Usuarios`?
- Qual tabela e `1:1` com `Usuarios`?
- Qual coluna garante o `1:1`?
- Por que `ConfiguracoesPerfil` foi separada de `Usuarios`?
- Quais indices unicos protegem regras de negocio?
- Por que `__EFMigrationsHistory` nao e tabela de dominio?

Resumo mental:

```text
Usuarios
  1:1 ConfiguracoesPerfil
  1:N RegistrosDiarios
  1:N MedidasBiometricas
  1:N Metas
  1:N Insights
```

Frase final para memorizar:

> O banco foi modelado para separar identidade, preferencias e historico. `Usuarios` e o centro, `ConfiguracoesPerfil` e o `1:1`, e as demais tabelas sao `1:N` porque representam dados que se acumulam ao longo do tempo.
