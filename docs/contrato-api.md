# Contrato da API

## Por que este documento existe

O projeto tem três componentes que conversam por esta API. Com o contrato fechado, cada cliente pode ser construído sem esperar o outro, e um quarto cliente pode ser escrito sem nenhuma pergunta ao autor.

1. O contrato muda antes do código, nunca depois. Toda mudança de endpoint entra primeiro aqui, com registro no histórico (seção 7).
2. O contrato é a especificação. Se a API faz algo diferente do que está escrito, o defeito está na API, a menos que o contrato seja mudado conscientemente.

A API também publica a documentação interativa (Swagger) em `http://localhost:3000/docs`. O Swagger descreve a API que existe; este documento descreve a que foi acordada.

---

## Identificação

| Campo | Valor |
|---|---|
| Projeto | Campo Conectado |
| Versão do contrato | 1.3 |
| Última atualização | 26/11/2026 |
| URL base (desenvolvimento) | `http://localhost:3000` |
| Formato | JSON (`Content-Type: application/json`) |

Endereço da API em cada ambiente: cliente web (no servidor do Next.js) usa a variável `API_URL`, padrão `http://localhost:3000`. App no emulador Android usa `http://10.0.2.2:3000`, e no celular físico o IP do computador na rede; o app lê o endereço de `--dart-define=API_URL=...`, nunca fixo no meio do código.

---

## 1. Convenções gerais

### 1.1 Nomenclatura

- Recursos no plural e em português, sem acento: `/areas`, `/maquinas`, `/ensaios`, `/medicoes`.
- Campos em `camelCase`, em português e sem acento: `numeroSerie`, `dataPrevista`, `situacao`.
- Valores de enum em maiúsculas: `PULVERIZACAO`, `EM_ANDAMENTO`, `NAO_CONFORME`.
- Desvio do modelo: os carimbos de tempo também estão em português (`criadoEm`, `atualizadoEm`), e a paginação usa `pagina` e `tamanho`, seguindo o padrão das aulas 6 e 10.
- Identificadores são inteiros gerados pelo servidor.

### 1.2 Métodos e status esperados

| Operação | Método e caminho | Sucesso | Erros comuns |
|---|---|---|---|
| Listar | `GET /recursos` | `200` | `400`, `401`, `403` |
| Obter um | `GET /recursos/:id` | `200` | `401`, `403`, `404` |
| Criar | `POST /recursos` | `201` | `400`, `401`, `403`, `409` |
| Atualizar | `PATCH /recursos/:id` | `200` | `400`, `401`, `403`, `404`, `409` |
| Remover | `DELETE /recursos/:id` | `204` | `401`, `403`, `404`, `409` |
| Transição de estado | `POST /ensaios/:id/<acao>` | `200` | `400`, `401`, `403`, `404`, `409` |

Transições como sub-recurso. Mudanças de situação do ensaio são operações do domínio (`/iniciar`, `/enviar`, `/devolver`, `/concluir`), não um `PATCH` no campo `situacao`. `400` é dado inválido ou regra de negócio não atendida; `409` é conflito com o estado atual (situação errada, registro duplicado, dependência que impede a remoção).

### 1.3 Formato de erro

Toda resposta de erro segue o mesmo formato, em qualquer endpoint (filtro global `FiltroDeExcecoes`):

```json
{
  "status": 400,
  "titulo": "BAD_REQUEST",
  "detalhes": ["o nome é obrigatório", "hectares deve ser maior que zero"],
  "caminho": "/areas",
  "momento": "2026-11-23T13:45:10.120Z"
}
```

| Campo | Tipo | Observação |
|---|---|---|
| `status` | número | O mesmo código HTTP da resposta |
| `titulo` | string | Nome do status (`BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`...) |
| `detalhes` | string[] | Sempre lista, mesmo com um erro só; mensagens em português, prontas para mostrar |
| `caminho` | string | URL da requisição |
| `momento` | ISO 8601 | Quando o erro aconteceu |

Em erro `5xx`, `detalhes` é sempre `["Erro interno do servidor"]`: nada do banco vaza. Campos que não existem no DTO são recusados com `400` (`"property X should not exist"`, mensagem padrão do NestJS, em inglês).

### 1.4 Paginação

Toda listagem aceita `pagina` (padrão 1) e `tamanho` (padrão 20, máximo 100):

`GET /areas?pagina=1&tamanho=20`

```json
{
  "dados": [],
  "pagina": 1,
  "tamanho": 20,
  "total": 0,
  "totalDePaginas": 1
}
```

`totalDePaginas` é no mínimo 1. Pedir uma página além da última devolve `dados` vazio, não `404`. `tamanho` acima de 100 ou `pagina` menor que 1 dão `400`.

### 1.5 Datas

- Carimbos de tempo em ISO 8601, em UTC: `2026-11-23T14:30:00.000Z`. A conversão para o fuso do usuário é de cada cliente.
- `dataPrevista` do ensaio é só data, no formato `AAAA-MM-DD`, sem hora. Os clientes não devem convertê-la por `Date`, para não deslocar um dia pelo fuso.

### 1.6 Números

Valores decimais trafegam como número JSON (`36.5`), nunca como texto. A API recusa `"3000"` onde espera número.

---

## 2. Autenticação

### 2.1 Estratégia

- O cliente troca e-mail e senha por um token em `POST /auth/login`.
- O token é um JWT HS256 com validade de 1 hora e sem refresh; vencido, a API responde `401` e o cliente pede login de novo.
- O token contém só `sub` (id do usuário) e `perfil`. Os clientes não decodificam o token: para saber quem está logado, chamam `GET /auth/perfil`.
- Todas as rotas exigem token, exceto `GET /saude` e `POST /auth/login`.

```
Authorization: Bearer <token>
```

### 2.2 Endpoints de autenticação

#### `GET /saude` (pública)

Situação da API e do banco. Resposta `200`: `{ "status": "ok", "banco": "ok" }`. Resposta `503`: banco indisponível (`detalhes: ["Banco de dados indisponível"]`).

#### `POST /auth/login` (pública)

Requisição

```json
{
  "email": "engenheiro@campo.dev",
  "senha": "..."
}
```

Resposta `200`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Status | Quando |
|---|---|
| `400` | E-mail fora do formato ou senha ausente |
| `401` | E-mail inexistente ou senha errada; a mensagem é a mesma nos dois casos (`"e-mail ou senha inválidos"`) |

#### `GET /auth/perfil`

Quem é o dono do token, lido do banco. Resposta `200`: `{ "id": 4, "nome": "Eduarda Engenheira", "email": "engenheiro@campo.dev", "perfil": "ENGENHEIRO" }`. `401`: token ausente, inválido ou vencido.

#### Cadastro de usuários

Não há auto-cadastro nem recuperação de senha. Os usuários são criados pelo seed (`backend/prisma/seed.ts`): um engenheiro e dois analistas de teste.

#### `GET /usuarios` (ENGENHEIRO)

Lista usuários para a atribuição de ensaios. Parâmetros: `perfil` (`ENGENHEIRO` ou `ANALISTA`), `pagina`, `tamanho`. Resposta `200`: paginada, com itens `{ "id": 5, "nome": "Artur Analista", "email": "analista@campo.dev", "perfil": "ANALISTA" }`. O hash da senha nunca é devolvido.

### 2.3 Perfis e permissões

| Perfil | Pode | Não pode |
|---|---|---|
| `ENGENHEIRO` | Cadastrar, editar e remover áreas e máquinas; listar usuários; planejar, editar e remover ensaios planejados; ver todos os ensaios e seus registros; devolver e concluir ensaios enviados | Registrar medições, falhas ou avaliação; iniciar ou enviar ensaios |
| `ANALISTA` | Ver os ensaios atribuídos a ele e seus registros; registrar e remover medições e falhas; preencher a avaliação; iniciar e enviar os próprios ensaios | Acessar áreas, máquinas e usuários; planejar, devolver ou concluir; ver ou mexer em ensaio de outro analista (`403`) |

### 2.4 Armazenamento do token em cada cliente

| Cliente | Onde o token fica | Nível de autenticação | Observação |
|---|---|---|---|
| Web (Next.js) | Cookie HttpOnly `campo_token`, `SameSite=Lax`, 1 hora; lido só no servidor | completa | O navegador nunca lê o token; páginas e Server Actions conferem a sessão; saída por POST apaga o cookie |
| Mobile (Flutter) | Memória da classe `Sessao` | simplificada | Login real; fechar o app encerra a sessão; em `401` o app volta ao login |

Nenhuma rota foi afrouxada para o app: ele apresenta um token válido em toda requisição autenticada.

---

## 3. Recursos

### 3.1 `Area`

Descrição: local onde os ensaios acontecem. Consumido por: web.

#### Representação

```json
{
  "id": 3,
  "nome": "Área Norte",
  "localizacao": "Campo experimental, talhão 3",
  "hectares": 42.5,
  "tipoSolo": "Latossolo vermelho",
  "observacoes": null,
  "criadoEm": "2026-11-19T13:20:00.000Z",
  "atualizadoEm": "2026-11-19T13:20:00.000Z"
}
```

| Campo | Tipo | Obrigatório na criação | Observação |
|---|---|---|---|
| `id` | inteiro | - | Gerado pelo servidor |
| `nome` | string (1 a 120) | sim | Único |
| `localizacao` | string (1 a 200) | sim | |
| `hectares` | número ou null | não | Maior que zero, até 2 casas decimais |
| `tipoSolo` | string (até 80) ou null | não | |
| `observacoes` | string ou null | não | |

| Endpoint | Perfil | Sucesso | Erros |
|---|---|---|---|
| `GET /areas?nome=&pagina=&tamanho=` | ENGENHEIRO | `200` paginado; `nome` filtra por parte do nome, sem diferenciar maiúsculas | `400`, `401`, `403` |
| `GET /areas/:id` | ENGENHEIRO | `200` | `404` "Área 9 não encontrada" |
| `POST /areas` | ENGENHEIRO | `201` | `400` validação; `409` nome repetido |
| `PATCH /areas/:id` | ENGENHEIRO | `200`; campos parciais, `null` apaga um opcional | `400`, `404`, `409` |
| `DELETE /areas/:id` | ENGENHEIRO | `204` | `404`; `409` "Área 3 possui ensaios vinculados e não pode ser removida" |

### 3.2 `CampoModelo` (ficha por linha)

Descrição: campos pré-definidos da ficha de cada linha, criados pelo seed. Consumido por: web (monta o formulário da máquina).

#### `GET /campos-modelo?linha=PULVERIZACAO` (ENGENHEIRO)

Resposta `200`

```json
{
  "linha": "PULVERIZACAO",
  "tipos": ["AUTOPROPELIDO"],
  "campos": [
    {
      "chave": "capacidadeTanque",
      "rotulo": "Capacidade do tanque",
      "tipo": "NUMERO",
      "unidade": "L",
      "obrigatorio": true,
      "minimo": 600,
      "maximo": 6000,
      "opcoes": [],
      "ordem": 1
    }
  ]
}
```

- `tipo` do campo: `TEXTO` (até 200 caracteres), `NUMERO`, `INTEIRO`, `BOOLEANO` ou `OPCAO` (um valor de `opcoes`).
- `tipos`: tipos de máquina aceitos pela linha (Distribuição: `ARRASTO`, `AUTOPROPELIDO`; Pulverização: `AUTOPROPELIDO`; Plantio: `ARRASTO`, `MONTADA`).
- `400` se `linha` faltar ou for inválida.

### 3.3 `Maquina`

Descrição: máquina em validação, com a ficha da sua linha. Consumido por: web.

#### Representação (detalhe)

```json
{
  "id": 4,
  "modelo": "Pulverizador P-3000",
  "numeroSerie": "PV-0001",
  "linha": "PULVERIZACAO",
  "tipo": "AUTOPROPELIDO",
  "ficha": [
    { "chave": "capacidadeTanque", "rotulo": "Capacidade do tanque", "tipo": "NUMERO", "unidade": "L", "valor": 3000 }
  ],
  "camposAdicionais": [
    { "id": 1, "nome": "Cor", "valor": "Laranja", "unidade": null }
  ],
  "criadoEm": "2026-11-19T13:20:00.000Z",
  "atualizadoEm": "2026-11-19T13:20:00.000Z"
}
```

A `ficha` vem na ordem dos campos da linha, com `valor` no tipo do campo (número, booleano ou texto). A listagem devolve só `id`, `modelo`, `numeroSerie`, `linha` e `tipo`.

#### Requisição de criação

```json
{
  "modelo": "Pulverizador P-3000",
  "numeroSerie": "PV-0001",
  "linha": "PULVERIZACAO",
  "tipo": "AUTOPROPELIDO",
  "ficha": { "capacidadeTanque": 3000, "comprimentoBarras": 36, "espacamentoBicos": 50, "potenciaMotor": 250, "limiteTemperaturaMotor": 105, "limiteTemperaturaHidraulico": 85 },
  "camposAdicionais": [{ "nome": "Cor", "valor": "Laranja" }]
}
```

| Campo | Regra |
|---|---|
| `modelo` | string, 1 a 120 |
| `numeroSerie` | string, 1 a 60, único |
| `linha` / `tipo` | enums; o tipo precisa ser aceito pela linha |
| `ficha` | objeto `{ chave: valor }`; toda chave obrigatória da linha presente, valor no tipo e na faixa do campo; chave desconhecida é recusada. A API devolve todos os erros de uma vez, ex.: `"Capacidade do tanque deve estar entre 600 e 6000"` |
| `camposAdicionais` | até 20; `nome` (até 80, sem repetir, sem diferenciar maiúsculas), `valor` (até 200), `unidade` (até 20, opcional) |

| Endpoint | Perfil | Sucesso | Erros |
|---|---|---|---|
| `GET /maquinas?linha=&busca=&pagina=&tamanho=` | ENGENHEIRO | `200` paginado; `busca` em modelo ou número de série | `400`, `401`, `403` |
| `GET /maquinas/:id` | ENGENHEIRO | `200` | `404` |
| `POST /maquinas` | ENGENHEIRO | `201` | `400` ficha ou tipo inválido; `409` número de série repetido |
| `PATCH /maquinas/:id` | ENGENHEIRO | `200`; `ficha` e `camposAdicionais`, quando enviados, substituem os anteriores inteiros | `400` (troca de linha sem a ficha nova); `404`; `409` (número de série repetido ou "Máquina 4 possui ensaios e não pode trocar de linha") |
| `DELETE /maquinas/:id` | ENGENHEIRO | `204` | `404`; `409` máquina com ensaios |

### 3.4 `Ensaio`

Descrição: teste planejado de uma máquina numa área, atribuído a um analista; centro do domínio. Consumido por: ambos.

#### Representação (detalhe)

```json
{
  "id": 3,
  "objetivo": "Avaliar desempenho do pulverizador em operação contínua",
  "situacao": "ENVIADO",
  "dataPrevista": "2026-12-01",
  "maquina": { "id": 4, "modelo": "Pulverizador P-3000", "numeroSerie": "PV-0001", "linha": "PULVERIZACAO" },
  "area": { "id": 3, "nome": "Área Norte" },
  "analista": { "id": 5, "nome": "Artur Analista" },
  "engenheiro": { "id": 4, "nome": "Eduarda Engenheira" },
  "enviadoEm": "2026-11-23T13:44:00.000Z",
  "concluidoEm": null,
  "devolucoes": [
    { "id": 1, "comentario": "Registrar mais uma medição do hidráulico", "autor": { "id": 4, "nome": "Eduarda Engenheira" }, "criadoEm": "2026-11-23T13:45:00.000Z" }
  ],
  "criadoEm": "2026-11-19T13:20:00.000Z",
  "atualizadoEm": "2026-11-23T13:45:00.000Z"
}
```

A listagem traz `id`, `objetivo`, `situacao`, `dataPrevista`, `maquina`, `area` e `analista`, ordenada pela data prevista. `devolucoes` vem da mais recente para a mais antiga.

`situacao`: `PLANEJADO`, `EM_ANDAMENTO`, `ENVIADO`, `DEVOLVIDO` ou `CONCLUIDO` (ciclo na seção 4).

#### Requisição de criação

```json
{
  "objetivo": "Validar estabilidade das barras em terreno ondulado",
  "maquinaId": 4,
  "areaId": 3,
  "analistaId": 5,
  "dataPrevista": "2026-12-01"
}
```

| Campo | Regra |
|---|---|
| `objetivo` | string, 1 a 200 |
| `maquinaId`, `areaId` | inteiros positivos de registros existentes |
| `analistaId` | inteiro de um usuário com perfil `ANALISTA` |
| `dataPrevista` | `AAAA-MM-DD`, data válida |

O engenheiro responsável é o dono do token. Referências inválidas voltam juntas: `["Máquina 999 não encontrada", "Usuário 4 não é um analista"]`.

| Endpoint | Perfil | Sucesso | Erros |
|---|---|---|---|
| `GET /ensaios?situacao=&analistaId=&maquinaId=&pagina=&tamanho=` | ambos | `200` paginado. Para o analista, a API força o filtro pelos ensaios dele (`analistaId` é ignorado) | `400`, `401` |
| `GET /ensaios/:id` | ambos | `200` | `403` "Este ensaio está atribuído a outro analista"; `404` |
| `POST /ensaios` | ENGENHEIRO | `201` com situação `PLANEJADO` | `400` |
| `PATCH /ensaios/:id` | ENGENHEIRO | `200`; campos parciais | `400`; `404`; `409` "Ensaio EM_ANDAMENTO não pode ser alterado; só PLANEJADO" |
| `DELETE /ensaios/:id` | ENGENHEIRO | `204` | `404`; `409` ensaio já iniciado |
| `GET /ensaios/:id/pendencias` | ambos | `200` `{ "pendencias": ["Falta ao menos uma medição de: Velocidade"] }`; lista vazia = pronto para enviar ou concluir | `403`, `404` |

### 3.5 `Medicao`

Descrição: valor de uma grandeza medido durante o ensaio. Consumido por: mobile (registro) e web (revisão).

```json
{
  "id": 10,
  "grandeza": "TEMPERATURA_MOTOR",
  "valor": 108.5,
  "horimetro": 1520.4,
  "observacao": null,
  "registradaEm": "2026-11-23T13:40:00.000Z"
}
```

`grandeza`: `TEMPERATURA_MOTOR`, `TEMPERATURA_HIDRAULICO`, `VELOCIDADE` ou `CONSUMO_COMBUSTIVEL`. A API guarda só o número; os clientes exibem com °C, °C, km/h e L/h.

| Campo da requisição | Regra |
|---|---|
| `grandeza` | obrigatório, um dos valores acima |
| `valor` | número, até 3 casas decimais |
| `horimetro` | opcional, maior ou igual a zero, até 1 casa decimal |
| `observacao` | opcional, até 500 |
| `registradaEm` | opcional, ISO 8601, não pode estar no futuro (tolerância de 5 minutos); ausente = hora do servidor |

| Endpoint | Perfil | Sucesso | Erros |
|---|---|---|---|
| `GET /ensaios/:ensaioId/medicoes?grandeza=&pagina=&tamanho=` | ambos (analista só nos próprios) | `200` paginado, em ordem cronológica | `403`, `404` |
| `POST /ensaios/:ensaioId/medicoes` | ANALISTA do ensaio | `201`; se o ensaio estava `PLANEJADO`, passa a `EM_ANDAMENTO` | `400`; `403`; `404`; `409` "Ensaio ENVIADO não aceita registros; só PLANEJADO, EM_ANDAMENTO ou DEVOLVIDO" |
| `DELETE /ensaios/:ensaioId/medicoes/:id` | ANALISTA do ensaio | `204` | `403`; `404` (também se a medição for de outro ensaio); `409` |

### 3.6 `Falha`

Descrição: ocorrência durante o ensaio. Consumido por: mobile (registro) e web (revisão).

```json
{
  "id": 2,
  "descricao": "Vazamento na mangueira de retorno do hidráulico",
  "componente": "Sistema hidráulico",
  "severidade": "MAIOR",
  "horimetro": 1524,
  "ocorridaEm": "2026-11-23T13:41:00.000Z"
}
```

| Campo da requisição | Regra |
|---|---|
| `descricao` | obrigatório, 1 a 1000 |
| `severidade` | obrigatório: `CRITICA`, `MAIOR` ou `MENOR` |
| `componente` | opcional, até 120 |
| `horimetro` | opcional, maior ou igual a zero, até 1 casa decimal |
| `ocorridaEm` | opcional, ISO 8601, não pode estar no futuro |

Endpoints `GET /ensaios/:ensaioId/falhas?severidade=`, `POST` e `DELETE /ensaios/:ensaioId/falhas/:id`, com as mesmas regras de perfil, situação e status das medições.

### 3.7 `Avaliacao` (Pulverização)

Descrição: avaliação do ensaio de Pulverização: condições, pareceres por critério, parecer final, evidências calculadas e pendências. Consumido por: mobile (preenche) e web (revisa). Só existe em ensaios de máquina da linha `PULVERIZACAO`; nas outras linhas a API responde `400`.

#### `GET /ensaios/:ensaioId/avaliacao` (ambos)

Resposta `200` (também quando nada foi preenchido: os campos vêm `null`)

```json
{
  "velocidade": 18,
  "terreno": "Ondulado",
  "horimetroInicial": 1520,
  "horimetroFinal": 1528.5,
  "capacidadeOperacional": 32,
  "capacidadeConcorrente": 30,
  "parecerFinal": "APROVADA_COM_RESSALVA",
  "justificativaFinal": "Trocar a mangueira antes da produção.",
  "criterios": [
    { "criterio": "ESTABILIDADE_BARRAS", "rotulo": "Estabilidade das barras", "parecer": "CONFORME", "justificativa": null },
    { "criterio": "TEMPERATURA_MOTOR", "rotulo": "Temperatura do motor", "parecer": "CONFORME_COM_RESSALVA", "justificativa": "Passou de 105 °C em subida longa." }
  ],
  "evidencias": {
    "temperaturaMotor": { "maxima": 108.5, "limite": 105, "excedeu": true },
    "temperaturaHidraulico": { "maxima": 80, "limite": 85, "excedeu": false },
    "falhasPorSeveridade": { "CRITICA": 0, "MAIOR": 1, "MENOR": 0 },
    "horasTrabalhadas": 8.5,
    "diferencaConcorrente": 6.7
  },
  "pendencias": [],
  "progresso": { "avaliados": 7, "total": 7 }
}
```

- `criterios`: sempre os 7, na ordem do app (`ESTABILIDADE_BARRAS`, `TEMPERATURA_MOTOR`, `TEMPERATURA_HIDRAULICO`, `DURABILIDADE`, `EFICIENCIA_CONCORRENTE`, `OPERACAO`, `MANUTENCAO`), com `parecer: null` nos não avaliados.
- `parecer`: `CONFORME`, `CONFORME_COM_RESSALVA` ou `NAO_CONFORME`. `parecerFinal`: `APROVADA`, `APROVADA_COM_RESSALVA` ou `REPROVADA`.
- `evidencias` é calculado pela API; o cliente exibe e nunca envia. `excedeu` é `null` quando falta a medição ou o limite da ficha; `diferencaConcorrente` é o percentual da capacidade própria acima (positivo) ou abaixo da concorrente, com 1 casa.
- `pendencias`: o que impede o envio (seção 4.2).

#### `PATCH /ensaios/:ensaioId/avaliacao` (ANALISTA do ensaio)

Salva as condições e o parecer final. Parcial: campo ausente não muda; `null` apaga.

| Campo | Regra |
|---|---|
| `velocidade` | km/h, maior que zero, até 2 casas |
| `terreno` | até 120 |
| `horimetroInicial`, `horimetroFinal` | maior ou igual a zero, até 1 casa; o final não pode ser menor que o inicial |
| `capacidadeOperacional`, `capacidadeConcorrente` | ha/h, maior que zero, até 2 casas |
| `parecerFinal` | enum; diferente de `APROVADA` exige `justificativaFinal` |
| `justificativaFinal` | até 1000 |

Resposta `200`: a avaliação atualizada, no formato do `GET`. Erros: `400` (ex.: "O horímetro final deve ser maior ou igual ao inicial", "Parecer final REPROVADA exige justificativa", ensaio fora da Pulverização); `403`; `404`; `409` ensaio que não aceita registros.

#### `PUT /ensaios/:ensaioId/avaliacao/criterios/:criterio` (ANALISTA do ensaio)

Salva o parecer de um critério ("salvar ao avançar"). Requisição: `{ "parecer": "NAO_CONFORME", "justificativa": "Eixo quebrou" }`. Parecer diferente de `CONFORME` exige justificativa. Resposta `200`: a avaliação atualizada. Erros: `400` ("Durabilidade das peças: parecer NAO_CONFORME exige justificativa", critério inexistente); `403`; `404`; `409`.

---

## 4. Endpoints de regra de negócio

### 4.1 Ciclo de vida do ensaio

```
PLANEJADO → EM_ANDAMENTO → ENVIADO → CONCLUIDO
                             ↓   ↑
                           DEVOLVIDO
```

Toda transição só grava se a situação lida ainda for a atual; se outra requisição mudou o ensaio no meio do caminho, a resposta é `409` "O ensaio mudou de situação durante a operação; tente de novo". Transição fora do ciclo devolve `409` com a situação atual e as aceitas, ex.: "Ensaio PLANEJADO não pode ser enviado; só EM_ANDAMENTO ou DEVOLVIDO".

| Endpoint | Perfil | De | Para | Efeito |
|---|---|---|---|---|
| `POST /ensaios/:id/iniciar` | ANALISTA do ensaio | `PLANEJADO` | `EM_ANDAMENTO` | (o primeiro registro faz o mesmo) |
| `POST /ensaios/:id/enviar` | ANALISTA do ensaio | `EM_ANDAMENTO`, `DEVOLVIDO` | `ENVIADO` | grava `enviadoEm` |
| `POST /ensaios/:id/devolver` | ENGENHEIRO | `ENVIADO` | `DEVOLVIDO` | cria a devolução com o comentário |
| `POST /ensaios/:id/concluir` | ENGENHEIRO | `ENVIADO` | `CONCLUIDO` | grava `concluidoEm`; o ensaio não muda mais |

Todas sem corpo, exceto `devolver`: `{ "comentario": "..." }` (obrigatório, até 1000). Resposta `200`: o ensaio no formato do detalhe.

| Status | Quando |
|---|---|
| `400` | Pendências de envio ou conclusão (seção 4.2), com a lista em `detalhes`; comentário ausente na devolução |
| `403` | Perfil errado, ou analista em ensaio de outro analista |
| `404` | Ensaio inexistente |
| `409` | Situação incompatível com a ação |

### 4.2 Requisitos para enviar e concluir

`enviar` e `concluir` conferem, na mesma transação da mudança de situação:

1. Medições mínimas: ao menos uma medição de cada grandeza. Falta vira `"Falta ao menos uma medição de: Temperatura do motor"`.
2. Avaliação (só Pulverização):
   - as condições preenchidas (`"Falta preencher: Velocidade"`) e o horímetro final não menor que o inicial;
   - os 7 critérios com parecer (`"Falta o parecer de: Manutenção"`) e a justificativa quando não é "Conforme";
   - o parecer final, com justificativa quando não é "Aprovada";
   - coerência: com falha crítica, a durabilidade não pode ser `CONFORME`; com falha crítica ou algum critério `NAO_CONFORME`, o parecer final não pode ser `APROVADA`.

O que falta volta em `detalhes` de um `400`, todos de uma vez, e também em `GET /ensaios/:id/pendencias` e no campo `pendencias` da avaliação, para os clientes mostrarem antes.

---

## 5. Diferenças de consumo entre os clientes

| Endpoint | Diferença | Cliente | Motivo |
|---|---|---|---|
| `GET /ensaios` | O analista recebe só os próprios ensaios (filtro forçado pela API) | mobile | Regra de autorização, não um parâmetro do cliente |
| Listagens | O app e os selects do web pedem `tamanho=100` numa página só | ambos | Volume pequeno no escopo do projeto |
| `GET /campos-modelo` | Usado só para montar o formulário de máquina | web | O app não cadastra máquinas |

Não há endpoint exclusivo de um cliente: a API é uma só.

---

## 6. Como verificar o contrato

- [x] Swagger habilitado no backend (`@nestjs/swagger`): `http://localhost:3000/docs` (JSON em `/docs-json`)
- [x] Testes e2e do backend (`backend/test/*.e2e-spec.ts`) exercitam os status e as mensagens descritos aqui
- [x] Tipos do cliente web derivados do contrato, em `web/src/lib/` (junto do acesso a cada recurso)
- [x] Modelos do mobile derivados do contrato, em `mobile/lib/models/`, testados com respostas falsas em `mobile/test/`
- [ ] Coleção de requisições versionada (arquivo `.http`): não feita; o Swagger cumpre o papel

---

## 7. Histórico de revisões

| Versão | Data | Alteração | Impacto nos clientes |
|---|---|---|---|
| 1.0 | 19/11/2026 | Versão inicial do contrato | - |
| 1.1 | 23/11/2026 | Endpoints dos passos 2.1 a 2.9: formato de erro próprio, paginação em português, ids inteiros, `GET /ensaios/:id/pendencias` | Web e mobile seguem esta versão |
| 1.2 | 24/11/2026 | `GET /auth/perfil` passa a devolver também `nome` e `email` | Web usa na tela de conta; sem efeito no mobile |
| 1.3 | 26/11/2026 | Revisão: caminhos, perfis, códigos de status, mensagens e limites de campo conferidos contra o código da API | Nenhum |
