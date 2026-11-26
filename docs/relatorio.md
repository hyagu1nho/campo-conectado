# Relatório Técnico de Desenvolvimento

Diário técnico do projeto, organizado por etapa.

---

## Identificação

| Campo | Valor |
|---|---|
| Nome do projeto | Campo Conectado |
| Grupo | Trabalho individual, autorizado pelo professor por e-mail em 03/10/2026 |
| Integrantes | Hyago Tonelli |
| Repositório | `https://github.com/hyagu1nho/campo-conectado` |
| Vídeo de apresentação | https://youtu.be/U3i5PyBSk9g |

---

## 1. Ambiente de desenvolvimento

O passo a passo de instalação está no `README.md` da raiz. Esta seção registra o que variou entre as máquinas e o que precisou ser resolvido fora do que o README previa.

### 1.1 Ferramentas e versões

| Ferramenta | Versão | Quem |
|---|---|---|
| Node.js | 22.23.5 (npm 10.9.9) | Hyago |
| Flutter SDK | 3.50.1, canal stable (Dart 3.14.0, DevTools 2.61.0) | Hyago |
| PostgreSQL | 18.7 (imagem `postgres:18`) | Hyago |
| Docker | 29.6.2 (Docker Desktop) | Hyago |
| Emulador ou dispositivo usado no mobile | Samsung SM M556B (Android), aparelho físico por cabo USB | Hyago |
| Sistema operacional | Windows 11 Pro (backend, web e testes); Linux 24.04 LTS (tentativa de executar o app no emulador) | Hyago |

Como o banco foi provisionado: Docker Compose, com o `docker-compose.yml` do repositório.

### 1.2 Divergências em relação ao README

| Componente | O que divergiu | Como foi resolvido |
|---|---|---|
| Banco | O `docker-compose.yml` do modelo montava o volume em `/var/lib/postgresql/data`; a imagem 18 guarda os dados em `/var/lib/postgresql/18/docker` | Volume montado em `/var/lib/postgresql` |
| Backend | `npm i @nestjs/config` instalou a versão 12 (feita para o NestJS 12, só ES Module); o Jest não conseguia carregar | Fixada a versão 4.x, compatível com o NestJS 11 |
| Backend | `prisma init` 7.10 cria `prisma7.config.ts` (o README cita `prisma.config.ts`) e pastas de skills para agentes de IA (`.agents`, `.claude`, `.windsurf`) | Mantido o nome `prisma7.config.ts` (Aula 7); pastas de skills apagadas |
| Backend | O cliente gerado pelo Prisma 7 importa arquivos com extensão `.js`; Jest e `ts-node` (seed) não resolviam esses imports | `importFileExtension = ""` no generator do `schema.prisma`: o cliente passa a importar sem extensão |
| Backend | O Prisma 7 carrega o motor de consulta por `import()` dinâmico, que o Jest só aceita com flag | `test:e2e` roda com `node --experimental-vm-modules`, em série (`--runInBand`) por causa do banco compartilhado e com `--testTimeout=30000` |
| Backend | Com o `prisma7.config.ts` na raiz, o `nest build` passava a gerar `dist/src/main.js` e o `start:prod` quebrava | `prisma` e `prisma7.config.ts` excluídos no `tsconfig.build.json` |
| Web | O README manda `create-next-app@latest` (hoje Next.js 16) com `--src-dir`; o PRD e a visão citavam Next.js 15; as aulas usam Next 16 sem `src/` | Seguido o README: Next.js 16 com `src/` (decisão do autor). PRD e visão atualizados para 16 |
| Web | O `create-next-app` 16.4 liga por padrão o modelo novo de cache (`cacheComponents` e `partialPrefetching`); as aulas usam o modelo anterior (`fetch` com `revalidate`/`tags` e `updateTag`) | As duas opções removidas do `next.config.ts` |
| Web | O `next dev` cria e recria o arquivo `AGENTS.md`, com instruções para agentes de IA | Mantido no repositório, porque apagar não adianta |
| Web | A porta 3000 é da API | `dev` e `start` com `-p 3001` no `package.json`; CORS da API liberado para `http://localhost:3001` (`CORS_ORIGIN`) |
| Mobile | O Flutter não executava na máquina de desenvolvimento inicial | O código do app foi escrito sem compilar; `flutter analyze` e `flutter test` foram executados depois em outra máquina, sem erros; em 26/11/2026 o app foi executado num aparelho Android físico (Samsung SM M556B, por cabo USB), com a API local acessada por `adb reverse` (passos em `mobile/README.md`). O `flutter run` compila e instala o APK, mas a abertura automática acusa `Activity class ... MainActivity does not exist`; o app não tem ícone no aparelho e só é executado pelo comando `flutter run` no terminal |
| Mobile | Sem `flutter create`, as pastas `android/` e `ios/` não existem no repositório | O `flutter create` gerou `android/` (commit `79aa312`); `ios/` não foi gerada. A permissão INTERNET e o `usesCleartextTraffic` de debug foram acrescentados aos manifests à mão, e as linhas repetidas que ficaram neles foram removidas |
| Backend | `CORS_ORIGIN` aceitava uma origem só | Passou a aceitar uma lista separada por vírgula (web na 3001 e, se preciso, o app no navegador na 3002) |

### 1.3 Endereços de rede entre os componentes

| Origem | URL da API usada | Observação |
|---|---|---|
| Web (navegador) | `http://localhost:3000`, pela variável `API_URL` do servidor do Next.js | O navegador não chama a API: quem chama é o servidor do Next.js, que roda na porta 3001 |
| Mobile (emulador) | `http://10.0.2.2:3000` | `localhost` do emulador não é o da máquina |
| Mobile (dispositivo físico) | `http://<ip-do-computador>:3000`, ou `http://localhost:3000` com `adb reverse tcp:3000 tcp:3000` | Informado por `--dart-define=API_URL=...` |

---

## 2. Uso de Inteligência Artificial

### 2.1 Ferramentas utilizadas

| Ferramenta | Versão / Plano | Quem usou | Em que componente |
|---|---|---|---|
| Claude Code | Claude Opus 5.5 e Claude Sonnet 5.5, alternados | Hyago | Backend, web e mobile |

### 2.2 Atenção específica desta stack

| Situação | Ocorreu? | Onde e como foi corrigido |
|---|---|---|
| Código gerado com Next.js Pages Router (`getServerSideProps`, `pages/api/`) | Não | O web usa App Router desde o início; nenhuma ocorrência registrada na seção 2.3 |
| Prisma sem o adaptador `@prisma/adapter-pg`, ou importando de `@prisma/client` em vez do caminho gerado | Não | `prisma.service.ts` usa `PrismaPg` e importa o cliente do caminho gerado (`src/generated/prisma/client`) |
| Decorators ou módulos de versão antiga do NestJS | Não | Nenhuma ocorrência registrada na seção 2.3 |
| Pacotes Flutter descontinuados ou incompatíveis com Flutter 3 | Não | O app usa só `http` e `flutter_lints`; `flutter analyze` sem erros |
| Outro | Sim | Passo 2.2: `npm i @nestjs/config` sem versão trouxe a 12 (NestJS 12). Corrigido fixando `@nestjs/config@4`. No passo 2.3 o mesmo risco com `@nestjs/swagger` (a 12 exige NestJS 12): instalado `@nestjs/swagger@11` já de início |

### 2.3 Evidências de uso

Um registro por etapa. Cada um traz como o trabalho foi conduzido, os prompts exatos, uma tabela com uma linha por passo e um trecho de código representativo. Os demais trechos estão nos arquivos e nos commits citados.

---

#### Etapa 2: Backend

- Quem conduziu: Hyago
- Ferramenta e data: Claude Code (modelos Claude Opus 5.5 e Claude Sonnet 5.5, alternados), 19/11/2026
- Componente: backend
- Como foi conduzido: o trabalho seguiu os passos 2.1 a 2.9 do roteiro. Em cada passo, a IA propunha o próximo e eu confirmava ou escolhia entre alternativas. O contexto vinha do enunciado, do README do modelo, das aulas 5 a 10 e das minhas decisões de domínio. Lint, testes e build serviam de portão antes de cada commit.
- Prompts exatos (a pergunta é da IA, a resposta entre aspas é minha):
  ```
  2.1   "Comece a implementação das coisas antes, depois escrevemos isso, pode ser?" (resposta seguinte: "Você escreve")
  2.2   "Docker aberto, pode seguir pro passo 2.2"
  Modelo de dados   "Rascunho o schema.prisma completo a partir do decisoes.md para você revisar?" -> "Sim, rascunhar"
                    "Quais medições o analista registra em campo?" -> "As 4 propostas servem"
  2.3   "Sigo para o passo 2.3, CRUD de áreas?" -> "Sim, seguir"
  2.4   "Sigo para o passo 2.4, login com JWT e guards?" -> "Sim, seguir"
  2.5   "Sigo para o passo 2.5, máquinas com ficha?" -> "Sim, seguir"
  2.6   "Sigo para o passo 2.6, ensaios e ciclo de vida?" -> "Sim, seguir"
  2.7   "Sigo para o passo 2.7, medições e falhas?" -> "Sim, seguir"
  2.8   "Sigo para o passo 2.8, avaliação da Pulverização?" -> "Sim, seguir"
  2.9   "Qual o mínimo de medições para concluir um ensaio (passo 2.9)?" -> "1 por grandeza"
  ```

| Passo | Trecho aproveitado | Análise crítica | Correções | Validação | Commit |
|---|---|---|---|---|---|
| 2.1 | `SaudeController`, remoção dos arquivos de exemplo do gerador, teste unitário e e2e de `GET /saude` | Estrutura mínima correta; o endpoint devolve valor fixo e não prova o banco, o que o 2.2 resolve | Nenhuma | `npm test`, e2e, lint, build e `curl` com 200 | `2cd7703` |
| 2.2 | `PrismaService` com `PrismaPg`, `SaudeService` (503 sem banco), `PrismaModule`, `prisma7.config.ts`, `.env.example`, testes com Prisma simulado | Correto no adaptador obrigatório do Prisma 7. Errado: `@nestjs/config` veio na versão 12 (NestJS 12) e o volume do PostgreSQL 18 estava no caminho antigo | `@nestjs/config` fixado em 4.x; volume corrigido para `/var/lib/postgresql`; pastas de skills de IA do `prisma init` apagadas | Testes, e2e com banco real, lint, build, `start:prod` | `2cd7703` |
| Modelo de dados | `schema.prisma` (13 entidades de domínio, `Usuario` e 11 enums), migration `init`, `seed.ts` | Campos de `Area` e `Maquina`, parecer só na avaliação, `Devolucao` própria e faixas dos campos por linha são propostas revisáveis; `TesteBandeja` e `ColetaBandeja` sem uso nesta versão | `importFileExtension = ""`, porque o seed com `ts-node` falhou com o cliente gerado | `prisma validate`, `migrate dev`, seed duas vezes com o mesmo resultado, senhas em bcrypt | `2cd7703` |
| 2.3 | `AreasService.traduzirErro`, `FiltroDeExcecoes`, `configurarApp`, `paginar()`, `AreaEntity`, Swagger | Padrão reutilizado nos outros recursos; as rotas ficam abertas até o 2.4 | Nenhuma; `@nestjs/swagger` na versão 11 desde o início | 9 unitários e 8 e2e; `curl` com 400 e 409 | `7e6e483` |
| 2.4 | `AuthModule` com guards globais, `JwtStrategy`, `@Public`, `@Roles`, `@UsuarioAtual`, `/auth/login`, `/auth/perfil`, `/usuarios` | Mesma mensagem para e-mail inexistente e senha errada; `senhaHash` nunca devolvido. Token de 1 hora não revogável e sem rota de cadastro, pois os usuários vêm do seed | Nenhuma; `@nestjs/jwt` e `@nestjs/passport` na versão 11 de propósito | 15 unitários e 18 e2e; `curl` com 401 e 200 | `7e6e483` |
| 2.5 | `validarFicha` (`ficha.ts`), `GET /campos-modelo`, CRUD de `/maquinas`, regra de tipo por linha | Erros devolvidos juntos; ficha guardada como texto e convertida na saída; número enviado como texto é recusado de propósito | Nenhuma | 24 unitários e 28 e2e | `4b02dc4` |
| 2.6 | `ciclo.ts` (máquina de estados), `EnsaiosService.mudarSituacao`, CRUD de `/ensaios`, devolução | Máquina pura testada antes do service; a transição só grava se a situação lida ainda for a atual; 409 para estado e 403 para outro analista; os requisitos de envio ficam para o 2.8 e o 2.9 | Nenhuma | 32 unitários e 36 e2e, com o ciclo completo | `75d49d0` |
| 2.7 | `acesso-ensaio.ts`, rotas `/ensaios/:ensaioId/medicoes` e `/falhas`, `@NaoFuturo` | O primeiro registro inicia o ensaio e ENVIADO bloqueia registro. Sem PATCH e sem faixa de valor por grandeza | Nenhuma | 37 unitários e 43 e2e | `75d49d0` |
| 2.8 | `regras.ts`, `GET` e `PATCH` da avaliação, `PUT .../criterios/:criterio`, evidências calculadas pela API | Coerência conferida só no envio, porque uma falha crítica pode vir depois do parecer; pendências no `GET` para o app avisar antes; o parecer final também exige justificativa | e2e intermitente, porque suítes em paralelo apagavam os dados umas das outras: prefixo por suíte; `Promise.all` trocado por consultas em sequência nas transações | 52 unitários e 50 e2e, rodados 6 vezes seguidas | `75d49d0` |
| 2.9 | `requisitos.ts`, `pendencias.ts`, `GET /ensaios/:id/pendencias` | Mínimo conferido no envio e na conclusão; uma medição por grandeza para todas as linhas, inclusive arrasto, pode exigir revisão | Nenhuma; o mínimo foi decisão do autor | 57 unitários e 50 e2e | `75d49d0` |

Trecho representativo, de `EnsaiosService.mudarSituacao`:

```ts
// a transição só grava se a situação lida ainda for a atual
const { count } = await tx.ensaio.updateMany({
  where: { id, situacao: atual.situacao },
  data: { ...dados, situacao: resultado.para },
});
if (count === 0) throw new ConflictException('O ensaio mudou de situação durante a operação; tente de novo');
```

Versão desatualizada da stack: uma vez, `@nestjs/config` 12 (seção 2.2). Nos demais passos, não.

---

#### Etapa 3: Cliente web

- Quem conduziu: Hyago
- Ferramenta e data: Claude Code (modelos Claude Opus 5.5 e Claude Sonnet 5.5, alternados), de 19/11/2026 a 24/11/2026
- Componente: web, com um ajuste no backend (`GET /auth/perfil` com nome e e-mail)
- Como foi conduzido: igual à Etapa 2, passo a passo, com lint, `tsc --noEmit` e build a cada passo e cada fluxo testado no navegador com os usuários do seed. Em 24/11, refiz as telas a partir de protótipos aprovados antes de qualquer código.
- Prompts exatos:
  ```
  3.1   "Sigo para a Etapa 3, o cliente web?" -> "Sim, seguir"
        "Next 16 com src/" (escolha entre Next 15, Next 16 com src/ e Next 16 sem src/)
  3.2   "Sigo para o passo 3.2, login com JWT?" -> "Sim, seguir"
  3.3   "Sigo para o passo 3.3, CRUD de áreas no web?" -> "Sim, seguir"
  3.4   "Continue o que estava fazendo." (passo 3.4, em 23/11)
  3.5   "Sigo para o passo 3.5, planejar ensaio?" -> "Sim, seguir"
  3.6   "Sigo para o passo 3.6, revisão e conclusão?" -> "Sim, seguir"
  Redesenho, em 24/11:
        "/frontend-design vamos refazer as telas da aplicação web.
         Antes de iniciar a implementação, faça os protótipos de telas para todas as telas, tanto web quanto app.
         Utilize um padrão para o desenvolvimento. Após me passar esses protótipos de tela, quando aprovar, poderá implementar.
         Use fonte Montserrat para a aplicação. Tire frases aleatórias; não use travessões nem pontos no meio da linha."
  ```

| Passo | Trecho aproveitado | Análise crítica | Correções | Validação | Commit |
|---|---|---|---|---|---|
| 3.1 | `src/lib/saude.ts` (server-only), página inicial com a situação da API, porta 3001, `.env.example` | Next.js 16 com App Router e `API_URL` só no servidor. O `create-next-app` 16.4 trouxe o modelo novo de cache, diferente das aulas; a IA leu as aulas e perguntou a versão quando os documentos divergiram | `cacheComponents` e `partialPrefetching` removidos do `next.config.ts`; escolhido Next 16 com `src/` | lint, `tsc --noEmit`, build; navegador com a API fora e no ar | `96a275e` |
| 3.2 | Server Action de login com cookie HttpOnly, `sessao.ts` (`obterUsuario`, `exigirEngenheiro`), `FormularioLogin` com `useActionState`, saída por POST | Token fora do JavaScript da página; o analista não recebe sessão no web; proteção página a página, sem middleware (aula 15); o cabeçalho só mostrava o perfil, porque `/auth/perfil` ainda não trazia o nome | Nenhuma | lint, tsc, build; navegador com os usuários do seed, com o cookie invisível em `document.cookie` | `96a275e` |
| 3.3 | `acoes.ts` de áreas, `api.ts`, `recusa.ts`, `formulario-area.ts`, páginas de áreas, `loading`, `error` e `not-found` | Sessão e redirect fora do `try`; recusas da API exibidas; valores mantidos após erro; cliente HTTP único e funções por entidade ao mesmo tempo; sem cache compartilhado em dados autenticados | Nenhuma | lint, tsc, build; navegador: busca, 409, remoção, página inexistente | `96a275e` |
| 3.4 | `formulario-maquina.ts`, `FormularioMaquina`, `CamposAdicionais`, `EscolhaDeLinha`, páginas de máquinas | Formulário montado no servidor pela linha na URL; perde-se o digitado ao trocar de linha, por isso a linha vem primeiro; a API confere por último | Nenhuma | lint, tsc, build; navegador com as 3 máquinas, faixas e 409 de série repetida | `6b47469` |
| 3.5 | `opcoes.ts` (3 listas em paralelo), `dataBrasileira` sem `Date`, `FormularioEnsaio`, páginas de ensaios | Selects limitados a 100 itens, o limite da API; editar e remover só aparecem em PLANEJADO, regra que vale na API | Nenhuma | lint, tsc, build; navegador: planejar, editar e ensaio iniciado sem os botões | `6b47469` |
| 3.6 | `revisao.ts`, `SecaoMedicoes`, `SecaoFalhas`, `SecaoAvaliacao`, `AcoesRevisao`, `devolverEnsaio` e `concluirEnsaio` | O web não recalcula nada; as unidades (°C, km/h e L/h) são convenção do cliente; a revisão mostra até 100 medições e 100 falhas | Nenhuma | lint, tsc, build; ensaio enviado montado por script e depois devolvido, reenviado e concluído | `6b47469` |
| Redesenho | Protótipos de 21 telas, componentes `ui/`, Montserrat com `next/font`, quadro de ensaios, régua das temperaturas, página de conta | O protótipo antes do código evitou retrabalho; colunas que exigiriam uma chamada à API por item ficaram de fora; a página da área filtra no web porque a API não filtra por área | Retirada de frases genéricas, travessões e pontos; rodapé removido; botão de mostrar senha; aviso antes de sair de formulário com dados | lint, tsc, build de produção, 50 e2e, navegador incluindo tema escuro | `96a275e`, `6b47469`, `78b93c5` |

Trecho representativo, de `src/app/login/acoes.ts`:

```ts
// token em cookie HttpOnly; o redirect fica fora do try
(await cookies()).set(COOKIE_SESSAO, token, {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "lax", path: "/", maxAge: DURACAO_SESSAO_SEGUNDOS,
});
redirect("/perfil");
```

Versão desatualizada da stack: não. A versão instalada (Next.js 16.4.6, React 19.3) é mais nova que a das aulas (16.3.4, React 19.2), e `useActionState` e o `retry` do `error.tsx` são os atuais.

---

#### Etapa 4: App mobile

- Quem conduziu: Hyago
- Ferramenta e data: Claude Code (modelos Claude Opus 5.5 e Claude Sonnet 5.5, alternados), de 23/11/2026 a 24/11/2026
- Componente: mobile
- Como foi conduzido: o código foi escrito sem compilador, passo a passo, com testes usando `MockClient`. O `flutter analyze` e o `flutter test` foram rodados depois em outra máquina, sem erros. A execução em dispositivo foi feita em 26/11/2026, num Samsung SM M556B: os registros feitos no app chegaram à API e apareceram no cliente web (ensaio 24).
- Prompts exatos:
  ```
  4.0 a 4.4   "continue fazendo o resto" (Etapa 4)
              "Flutter bloqueado pela política da máquina" -> "Escrever sem compilar"
  Visual      "Aprovar e implementar" (protótipos do web e do app)
              "Baixo os arquivos da Montserrat para o app?" -> "Sim, baixar"
  ```

| Passo | Trecho aproveitado | Análise crítica | Correções | Validação | Commit |
|---|---|---|---|---|---|
| 4.0 a 4.4 | `api.dart` (`ApiCampo`, falhas como subclasses de `FalhaDaApi`, `descreverFalha`), `sessao.dart`, modelos com `fromJson` manual, telas de login, meus ensaios, ensaio, nova medição, nova falha e avaliação | Falhas como subclasses de uma classe base; sessão Simplificada com o token em memória (a aula 20 usa `flutter_secure_storage`); o app só mostra o que a API devolve. Escrito sem compilador, então `flutter analyze` e `flutter test` foram a primeira validação real | Ajuste de estilo sugerido pelo lint; linhas repetidas removidas dos manifests do Android (permissão INTERNET e `usesCleartextTraffic`), que só um `flutter run` revelaria | `flutter analyze` e `flutter test` sem erros; execução em dispositivo em 26/11/2026 (Samsung SM M556B), com os registros feitos no app visíveis no web | `78b93c5`, `79aa312`, `46d23fe` |
| Visual | `tema.dart`, `painel.dart`, lista com filtros, régua das leituras, Montserrat com a licença OFL | Reproduz as cores e a fonte do web; foi validado por análise e teste, e conferido na execução no aparelho | Nenhuma | `flutter analyze` e `flutter test` sem erros | `78b93c5` |

Trecho representativo, de `lib/services/api.dart`:

```dart
// toda falha vira uma subclasse de FalhaDaApi, e a tela só mostra a mensagem
class FalhaDaApi implements Exception { const FalhaDaApi(); }
class SemConexao extends FalhaDaApi { const SemConexao(); }

String descreverFalha(FalhaDaApi falha) {
  if (falha is SemConexao) return 'Sem conexão com o servidor.';
  if (falha is ErroDaApi && falha.status == 401) {
    return 'Sua sessão expirou ou não é válida. Entre de novo.';
  }
  ...
}
```

Versão desatualizada da stack: não, confirmado pelo `flutter analyze`. `DropdownButtonFormField.initialValue` e `Color.withValues` exigem Flutter 3.35 ou mais novo, por isso `sdk: ^3.9.0`.

---

### 2.4 Reflexão sobre o uso de IA

A IA acelerou o desenvolvimento nas partes repetitivas e bem delimitadas: a estrutura do CRUD de áreas, que virou o padrão dos outros recursos, os testes unitários e e2e, os formulários do web e as telas do app a partir dos protótipos. Foi menos confiável quando o assunto era a versão da stack: pacotes feitos para o NestJS 12 e o modelo de cache do Next.js 16, diferente do que as aulas ensinam, exigiram conferência e correção (seção 2.2). No NestJS e no Next.js o código gerado precisou de poucos ajustes. O que ficou como método: pedir um passo por vez, usar teste, lint e build como portão, ler cada trecho antes do commit e registrar o prompt, a análise e a correção na seção 2.3.

---

## 3. Diário por etapa

---

### Etapa 0: Concepção

Período: de 01/10/2026 a 03/10/2026. Redigido por: Hyago

O que foi feito: escolha de um tema próprio e pedido ao professor para fazer o trabalho individualmente (autorizado por e-mail). Definição do domínio: as três linhas de atuação (Distribuição, Pulverização, Plantio) e o que cada uma avalia; os dois perfis (engenheiro no web, analista no app); a ideia central de que a atribuição é o próprio ensaio. Recorte do MVP em quatro casos de uso (CU-W1, CU-W2, CU-M1, CU-M2), com a avaliação da Pulverização como funcionalidade central.

Como o tema foi escolhido, e o que foi descartado no caminho: o tema vem do trabalho com ensaios de campo de máquinas agrícolas e tem afinidade com o tema 5 do enunciado ("Inspeções e não conformidades"). Ficaram pelo caminho: as notas de 1 a 5 por critério, trocadas por parecer de conformidade, porque nota é subjetiva e não diz o que fazer; o termo "técnico", trocado por "analista de validação"; e o teste de bandeja da Distribuição, que foi modelado, mas ficou com prioridade Média para caber no trabalho individual.

Dificuldades: nenhuma relevante, porque o tema é da área em que atuo profissionalmente. A parte mais trabalhosa foi o levantamento dos itens de cada máquina, isto é, os campos da ficha técnica de cada linha.

---

### Etapa 1: Contrato e fundação

Período: 19/11/2026. Redigido por: Hyago

O que foi feito:

| Frente | O que foi feito | Por quem |
|---|---|---|
| Modelo de dados | `schema.prisma` completo desde a primeira migration: 14 modelos, incluindo os de prioridade Média (campos adicionais, teste de bandeja), para eles entrarem depois sem mudar a estrutura | Hyago |
| Projeto do backend | NestJS 11 com Prisma 7 e `@prisma/adapter-pg`; PostgreSQL 18 em Docker | Hyago |
| Ambiente | `docker-compose.yml` do PostgreSQL 18 com o volume corrigido (commit `ec8ae46`) | Hyago |

Decisões técnicas:

| Decisão | Alternativas consideradas | Justificativa | Risco ou consequência |
|---|---|---|---|
| Identificadores inteiros autoincrementais | uuid, cuid | Fáceis de ler nas URLs e nos testes; o domínio não exige id distribuído | Ids previsíveis; a proteção fica nos guards e na checagem de dono do ensaio |
| Modelo de dados completo na primeira migration | Migrar aos poucos, por funcionalidade | Itens de prioridade Média entram sem nova migration | Tabelas sem uso nesta versão (`TesteBandeja`, `ColetaBandeja`) |
| Ficha da máquina como valor por campo (`CampoModelo` + `ValorCampo`) | Uma coluna por campo; um JSON solto | Os campos de cada linha mudam pelo seed, sem migration, e a API valida tipo e faixa de cada um | Valor guardado como texto, convertido na saída |
| Docker só para o banco | Tudo em container; Postgres instalado | Backend e web direto no Node, com recarga e depuração simples | Depende do Docker Desktop estar aberto |

Dificuldades: o volume do PostgreSQL 18 mudou de lugar (`/var/lib/postgresql`); o `docker-compose.yml` do modelo apontava para o caminho antigo.

O que ficou para a próxima etapa: o backend inteiro, em fatias (passos 2.1 a 2.9).

---

### Etapa 2: Backend, Checkpoint 1

Período: 19/11/2026. Redigido por: Hyago, com apoio do Claude Code (registro na seção 2.3)

O que foi implementado: `GET /saude`; Prisma com seed (um engenheiro, dois analistas, fichas das três linhas, duas áreas, três máquinas e dois ensaios); CRUD de áreas como padrão do projeto (erro único, paginação, validação com mensagens em português); login com JWT e guards globais por perfil; máquinas com ficha validada pela linha e campos adicionais; ensaios com ciclo de vida; medições e falhas; avaliação da Pulverização com evidências e regras de coerência; requisitos de envio e conclusão. 59 testes unitários e 50 e2e.

Decisões técnicas:

| Decisão | Alternativas consideradas | Justificativa | Risco ou consequência |
|---|---|---|---|
| Formato de erro próprio `{status, titulo, detalhes, caminho, momento}` | Formato padrão do NestJS | Padrão das aulas; `detalhes` sempre lista, em português, pronta para mostrar | Um filtro global a manter; a mensagem de campo não permitido ("property should not exist") fica em inglês |
| `400` para dado inválido ou regra não atendida; `409` para conflito de estado | Tudo como `400` ou `422` | O cliente distingue "corrija os dados" de "a situação não permite" | Exige disciplina em cada service |
| Transições como sub-recurso (`/iniciar`, `/enviar`, `/devolver`, `/concluir`) | `PATCH` no campo `situacao` | Cada transição tem pré-condições e efeitos próprios | Mais rotas |
| Transição só grava se a situação lida ainda for a atual | Transação simples | Duas ações simultâneas não corrompem o ensaio | Resposta `409` em corrida rara |
| Máquina de estados e regras da avaliação como funções puras, testadas antes do service | Regras dentro do service | Testes rápidos e regras legíveis num lugar só | Nenhum relevante |
| Primeiro registro inicia o ensaio | Exigir o "iniciar" explícito | O analista no campo só registra; a API cuida da situação | O endpoint `/iniciar` existe, mas o app quase não precisa dele |
| Mínimo de uma medição por grandeza, para todas as linhas | Mínimo por linha; número total | Decisão do autor; garante as evidências de temperatura | Máquinas de arrasto exigem temperatura do motor (a do trator); revisar |

Mudanças no contrato da API: entraram endpoints de apoio aos clientes, registrados no histórico do contrato (versão 1.1):

| Endpoint | O que mudou | Quem foi avisado | Contrato atualizado? |
|---|---|---|---|
| `GET /campos-modelo?linha=` | Novo: o web monta o formulário da máquina a partir dele | Não se aplica (autor único) | Sim (versão 1.1) |
| `GET /usuarios?perfil=ANALISTA` | Novo: lista para atribuir o ensaio | Não se aplica | Sim |
| `GET /ensaios/:id/pendencias` | Novo: o que impede enviar ou concluir, para os clientes mostrarem antes | Não se aplica | Sim |

Dificuldades: pacotes da linha 12 (`@nestjs/config`, `@nestjs/swagger` e outros) feitos para o NestJS 12, só ES Module; o cliente gerado pelo Prisma 7 com imports `.js` e carregamento dinâmico, que o Jest não resolvia; o `nest build` gerando `dist/src` por causa do `prisma7.config.ts`; um teste e2e intermitente, porque as suítes rodavam em paralelo e apagavam os dados umas das outras. Todas registradas na seção 1.2 e na 2.3. Fica um aviso do `pg` nos e2e ("client.query() when the client is already executing a query"), sem efeito hoje.

O que ficou para a próxima etapa: o cliente web; o teste de bandeja segue fora desta versão.

---

### Etapa 3: Cliente web, Checkpoint 2

Período: de 19/11/2026 a 24/11/2026. Redigido por: Hyago, com apoio do Claude Code

O que foi implementado: projeto Next.js 16 com `src/`; login com o token em cookie HttpOnly; áreas; máquinas com o formulário da ficha montado pela linha escolhida; planejamento de ensaios; revisão do ensaio enviado, com devolver e concluir. Em 23/11, um redesenho visual feito em casa (componentes em `components/ui/`, tema claro e escuro). Em 24/11, a remoção do rodapé, o botão de mostrar a senha e o aviso antes de sair de um formulário com dados digitados; depois, o redesenho de todas as telas a partir de protótipos aprovados: fonte Montserrat, paleta de aço, grafite e verde, quadro de ensaios por situação, revisão com régua das temperaturas e decisão ao lado, e conta com nome, e-mail e tema.

Decisões técnicas:

| Decisão | Alternativas consideradas | Justificativa | Risco ou consequência |
|---|---|---|---|
| Next.js 16 com `src/` | Next 15 (PRD antigo); Next 16 sem `src/` (aulas) | O README do enunciado manda `create-next-app@latest` com `--src-dir` | PRD e visão atualizados para 16 |
| Sem `cacheComponents` | Modelo novo de cache, padrão do `create-next-app` 16.4 | As aulas usam o modelo anterior (`fetch` com `revalidate` e `tags`) | Configuração diferente da que o gerador cria |
| Token em cookie HttpOnly, lido só no servidor; leituras e escritas pelo servidor (Server Components e Server Actions) | Token no `localStorage`; chamadas do navegador | O token nunca chega ao JavaScript da página; sem CORS para os fluxos do web | Toda página autenticada é dinâmica |
| Leituras autenticadas com `cache: "no-store"` | Cache com tags e `updateTag` | Dados de um usuário não entram em cache compartilhado | Uma ida à API por página |
| Formulário da máquina montado pela URL (`?linha=`) | Buscar os campos no navegador | Segue a regra das aulas de manter a busca no servidor | Trocar a linha recarrega a página; por isso a linha vem primeiro e o aviso de saída cobre a troca |
| Proteção por página e por ação, sem middleware | `middleware.ts` / `proxy.ts` | Modelo da aula 15 | Cada página nova precisa chamar `exigirEngenheiro()` |
| Protótipos de todas as telas antes do redesenho | Redesenhar direto no código | Aprovar o visual sem gastar implementação; um padrão único para web e app | Uma rodada a mais antes do código |
| Montserrat por `next/font` | Link para o Google Fonts no `<head>` | A fonte é baixada no build e servida pelo próprio Next, sem chamada ao Google no navegador | O build precisa de internet |
| Início do engenheiro como quadro por situação | Tabela paginada com filtro | Mostra de uma vez o que espera a decisão dele | Cada coluna mostra até 100 ensaios (limite da API) |

Mudanças no contrato da API:

| Endpoint | O que mudou | Quem foi avisado | Contrato atualizado? |
|---|---|---|---|
| (nenhum endpoint) | CORS liberado para `http://localhost:3001` pela variável `CORS_ORIGIN` | Não se aplica | Não afeta o contrato; registrado no `.env.example` |
| `GET /auth/perfil` | Passa a devolver também `nome` e `email`, lidos do banco, para a página da conta | Os dois clientes (o app lê só `id` e `perfil`) | Sim, `docs/contrato-api.md` |

Dificuldades: a divergência de versão entre README, PRD e aulas; o `next dev` recriando o `AGENTS.md`; o painel do navegador oculto travando a página no esqueleto de carregamento durante os testes; o Docker Desktop fechado em alguns dias, sem o qual a API não sobe.

O que ficou para a próxima etapa: o botão "voltar" do navegador, que não passa pelo aviso de saída.

---

### Etapa 4: App mobile, Checkpoint 3

Período: de 23/11/2026 a 26/11/2026. Redigido por: Hyago, com apoio do Claude Code

O que foi implementado: código dos passos 4.0 a 4.4: primeira chamada à API (`GET /saude`) na tela de login; login no nível Simplificada; meus ensaios; detalhe do ensaio com registros, devolução e pendências; nova medição; nova falha; avaliação da Pulverização com um critério por vez (na Etapa 5 passou a ter um único botão para salvar); envio. Testes com `MockClient` para o cliente da API, a sessão, as validações e a tela de login. Em casa, o `flutter analyze` foi rodado e um ajuste de estilo sugerido pelo lint foi aplicado. Em 24/11, o app recebeu o mesmo padrão visual do web (`lib/tema.dart`, `widgets/painel.dart` e a Montserrat em `assets/fontes/`). Depois, `flutter analyze` e `flutter test` passaram sem erros.

Decisões técnicas:

| Decisão | Alternativas consideradas | Justificativa | Risco ou consequência |
|---|---|---|---|
| Sessão Simplificada (token em memória) | Completa, com `flutter_secure_storage` (aula 20); Simulada | Decisão do autor; login real sem guardar o token no aparelho | Fechar o app pede login de novo |
| Pacote `http` com cliente injetável | `dio` | Padrão das aulas; permite testar com `MockClient` sem rede | Nenhum relevante |
| `setState` nas telas e `ChangeNotifier` na sessão | Provider, Riverpod, Bloc | Suficiente para o escopo, como nas aulas | Nenhum relevante |
| Falhas como classes que estendem `FalhaDaApi` (`SemConexao`, `TempoEsgotado`, `ErroDaApi`, `RespostaInesperada`) | Exceções genéricas | Cada tela mostra a mensagem certa, e o 401 volta ao login | Nenhum relevante |
| Endereço da API por `--dart-define` | `flutter_dotenv` (sugerido no README) | Sem dependência nova; padrão das aulas | Trocar o endereço exige rodar de novo |

Mudanças no contrato da API:

| Endpoint | O que mudou | Quem foi avisado | Contrato atualizado? |
|---|---|---|---|
| (nenhum endpoint) | `CORS_ORIGIN` passou a aceitar uma lista separada por vírgula | Não se aplica | Não afeta o contrato |

Dificuldades: o Flutter não executava na máquina de desenvolvimento inicial, então o código foi escrito sem compilar. O `flutter analyze` e o `flutter test` rodaram depois em outra máquina, sem erros, mas o emulador Android não iniciou de forma estável nela, e a execução do app em dispositivo só aconteceu em 26/11/2026, num celular Android físico por cabo USB. O `flutter run` compila e instala o app, mas a abertura automática falha com `MainActivity does not exist`; o app não tem ícone no aparelho e só é executado pelo `flutter run` no terminal. O manifest tem a activity e o filtro de abertura, então a causa não foi identificada até o fechamento. Os manifests do Android, gerados pelo `flutter create`, ficaram com linhas repetidas (a permissão INTERNET e o `usesCleartextTraffic`), que só um `flutter run` revelaria; foram corrigidos no commit `46d23fe`.

O que ficou para a próxima etapa: a causa do erro de abertura automática do `flutter run`; a tela de abertura nativa do app (protótipo "App: abertura"), que depende das pastas geradas pelo `flutter create`.

---

### Etapa 5: Integração e fechamento

Período: 26/11/2026 (entrega final). Redigido por: Hyago

O que foi ajustado para os três componentes conversarem: o contrato da API foi conferido contra os controllers do backend (caminhos, perfis, códigos de status, mensagens e limites de campo), sem divergências, e passou para a versão 1.3. Os testes do backend foram rodados de novo num clone limpo (59 unitários e 50 e2e), com lint e build sem erro no backend e no web. A ficha da linha Plantio foi ajustada: dosador Elétrico, até 91 linhas e capacidade de sementes obrigatória; como o formulário do web é montado pelos campos da API, a mudança apareceu nos clientes sem alterar o código deles. O cabeçalho e o espaçamento das telas do web foram melhorados (commits `fd3ae94` e `d1bfcf7`). Já estava preparado: o mesmo seed para os dois clientes, a mesma API e as mesmas unidades das grandezas nos dois. A demonstração de ponta a ponta foi gravada com o web e o app compilado para o navegador (vídeo da seção 7); o fluxo completo de devolução, reenvio e conclusão no aparelho não foi conferido.

Inconsistências encontradas, e como foram resolvidas: os manifests do Android gerados pelo `flutter create` ficaram com linhas repetidas (a permissão INTERNET e o `usesCleartextTraffic`), corrigidas no commit `46d23fe`; no README, o `tsc` do web falhava num clone limpo porque o Next.js gera os tipos `PageProps` e `LayoutProps` no build, e a ordem dos comandos foi corrigida; a documentação falava em 15 modelos no `schema.prisma`, que tem 14, e foi corrigida. O app confere antes de enviar duas regras que a API também confere (justificativa quando o parecer não é Conforme e horímetro final não menor que o inicial); foi mantido como validação antecipada, e a API continua decidindo.

Dificuldades: o Flutter não executava na máquina de desenvolvimento inicial, e o emulador Android não iniciou de forma estável no Linux. A execução do app em dispositivo foi feita no fechamento (26/11/2026). Nela apareceu um limite de uso: com falha crítica registrada, a API recusa o envio (durabilidade Conforme ou parecer final Aprovada), o botão de enviar fica desligado, as pendências aparecem na tela e o analista precisa mudar esses pareceres para destravar. A avaliação do app tinha um botão de salvar por bloco e passou a ter um único botão, `Salvar avaliação`.

---

## 4. Arquitetura: decisões e evolução

### 4.1 Estrutura final

A estrutura das três pastas segue o `README.md` da raiz. A tabela registra os desvios e o motivo de cada um.

| Componente | Desvio em relação ao README | Motivo |
|---|---|---|
| Backend | Configuração do Prisma em `prisma7.config.ts` (o README cita `prisma.config.ts`) | Nome gerado pelo `prisma init` 7.10 e usado na Aula 7 |
| Backend | Cliente do Prisma gerado em `src/generated/prisma`, fora do Git | Padrão do Prisma 7; recriado com `npx prisma generate` |
| Backend | Pasta `src/comum/` (filtro de erro, paginação, validador de data) e `src/configurar-app.ts` | Código usado por vários módulos; a configuração da aplicação é a mesma no `main.ts` e nos testes e2e |
| Backend | Medições, falhas e avaliação em módulos próprios, com rotas aninhadas em `/ensaios/:ensaioId/...` | Cada recurso com seu módulo; a rota mostra que o registro pertence ao ensaio |
| Cliente web | Sem `src/types/`: tipo, leitura e escrita de cada recurso em `src/lib/<recurso>.ts`, sobre um `src/lib/api.ts` comum | Padrão das aulas 13 a 15; o README sugere o `api.ts` único, e ficou um pouco de cada |
| Cliente web | Server Actions em `src/app/<recurso>/acoes.ts`; componentes visuais base em `src/components/ui/` | Padrão das aulas (`acoes.ts`); o redesenho separou a base visual |
| Cliente web | Sessão em `src/lib/sessao.ts` (o README sugere `auth.ts`) | Nome da aula 15 |
| App mobile | `formatos.dart` e `validacao.dart` na raiz de `lib/` | Funções puras usadas por várias telas |
| App mobile | Pasta `android/` gerada pelo `flutter create` (commit `79aa312`); a pasta `ios/` não foi gerada | O app é executado em Android |

### 4.2 Fronteira entre backend e clientes

Toda regra está no backend, nos services ou em funções puras testadas (`maquinas/ficha.ts`, `ensaios/ciclo.ts`, `ensaios/requisitos.ts`, `avaliacao/regras.ts`). Os clientes nunca acessam o banco e nunca enviam valores calculados: evidências (temperatura máxima contra o limite da ficha, falhas por severidade, horas trabalhadas, diferença para a concorrente) e pendências vêm prontas da API, e os clientes só exibem.

Casos em que a tentação apareceu:

- Ficha da máquina. O web precisava mostrar os campos e as faixas de cada linha. Em vez de copiar a lista para o cliente, a API ganhou `GET /campos-modelo`; o web monta o formulário a partir dela e a API valida de novo no envio.
- "O que falta para enviar". O app e o web precisavam avisar antes do envio. Reimplementar as regras de coerência nos dois clientes duplicaria a regra em três lugares; a API ganhou `GET /ensaios/:id/pendencias`, que usa a mesma função do envio.
- Situação do ensaio. Os clientes escondem botões que não valem na situação atual (editar um ensaio já iniciado, enviar um ensaio planejado), mas é só conveniência: a API recusa com `409` qualquer transição fora do ciclo.
- Validação de formulário. Web e app conferem obrigatórios, números e faixas antes de enviar, para dar o erro junto do campo. É validação antecipada, registrada como tal na seção 5 do PRD; a API continua sendo a fonte da verdade.

A exceção consciente é de apresentação, não de regra: as unidades das grandezas (°C, km/h, L/h) são uma convenção dos clientes, porque a API guarda só o número.

### 4.3 Nível de autenticação adotado no app mobile

A sessão Simplificada vale para o app e nunca para a API: os endpoints continuam protegidos por guard, e o app apresenta um token válido em toda chamada.

| Aspecto | Registro |
|---|---|
| Nível adotado | Simplificada |
| Como o app obtém o token | Login real: `POST /auth/login` com e-mail e senha, depois `GET /auth/perfil` para confirmar que é analista. O token fica só na memória da classe `Sessao` |
| O que deixou de ser tratado (expiração, refresh, logout) | Persistência (fechar o app encerra a sessão) e renovação. A expiração é tratada pela resposta: em 401 o app volta ao login. Há botão de sair |
| Rotas da API afetadas pela escolha | Nenhuma |

### 4.4 O que os dois clientes compartilham e o que não

| Aspecto | Web | Mobile | Consistente? |
|---|---|---|---|
| Tipos e modelos | Tipos TypeScript escritos à mão a partir do contrato, em `src/lib/<recurso>.ts` | Classes Dart com `fromJson` manual (leitura direta dos campos do JSON), em `lib/models/` | Sim: os dois seguem o contrato (versão 1.3), campo a campo; nenhum gera tipos automaticamente |
| Tratamento de erro | Recusas `400`, `404` e `409` mostram os `detalhes` da API no topo do formulário; falha de rede ou `5xx` vira mensagem genérica | Classe `FalhaDaApi` com uma subclasse por tipo; `descreverFalha` mostra os `detalhes` da API ou uma mensagem por tipo | Sim: as mensagens de regra vêm da API, iguais nos dois |
| `401` e `403` | Mensagem própria; a sessão vencida leva ao login | Em `401` a sessão é encerrada e o app volta ao login; `403` explica a falta de permissão | Sim |
| Sessão | Completa: cookie HttpOnly, 1 hora, saída por POST | Simplificada: token em memória | Diverge por decisão: o nível do app foi escolhido e declarado (seção 4.3) |
| Perfil aceito | Só o engenheiro; o analista é recusado no login | Só o analista; o engenheiro é recusado no login | Espelhado de propósito: cada cliente é de um perfil |
| Datas | `dataPrevista` exibida sem passar por `Date`; demais datas no fuso de São Paulo | A mesma regra, sem `DateTime` para `dataPrevista`; demais no fuso do aparelho | Sim |
| Números | Vírgula decimal nos formulários e na exibição | Vírgula decimal nos formulários e na exibição | Sim |
| Unidades das grandezas | °C, km/h, L/h | °C, km/h, L/h | Sim (convenção dos clientes) |
| Listagens | Paginadas na tela (10 por página) | Uma página de até 100 itens, com puxar para atualizar | Diverge: o analista vê poucos ensaios por vez; o engenheiro vê o acervo todo |

---

## 5. Resposta ao RFC (seção condicional)

Houve RFC neste projeto? Não. Seção não aplicável.

O professor não publicou nenhum RFC durante o semestre. O arquivo `docs/rfc-001.md` permanece como modelo não preenchido.

---

## 6. Reflexão final

### 6.1 O que funcionou bem

O trabalho em fatias verticais, com lint, testes e build como portão a cada passo, deixou cada etapa com algo funcionando e verificado. Manter toda a regra de negócio no backend, em funções puras testadas, fez dos clientes exibidores do que a API calcula e evitou duplicar regra entre web e app. O formato de erro único e o endpoint `GET /ensaios/:id/pendencias` deram aos dois clientes a mesma mensagem, vinda da API. Os protótipos aprovados antes do redesenho evitaram retrabalho.

### 6.2 O que faria diferente

Faria commits ao longo do desenvolvimento, em vez de concentrar o histórico no fim, e cumpriria os checkpoints nos prazos oficiais. Configuraria o ambiente do Flutter desde o início, para compilar e rodar o app junto com a API, em vez de escrever o código sem compilador. Rodaria o app em dispositivo antes de redesenhar as telas. Como o trabalho é individual, a divisão entre as três frentes foi sequencial (backend, web, mobile); faria ciclos menores, com demonstração de ponta a ponta já na Etapa 3.

### 6.3 Principais aprendizados

| Componente | Aprendizado |
|---|---|
| Backend | Prisma 7 exige o adaptador `@prisma/adapter-pg` e muda a configuração dos testes (Jest e imports dinâmicos); guards globais com `@Public` e `@Roles`; máquina de estados e regras como funções puras testadas; separar `400` (dado inválido) de `409` (conflito de estado) |
| Web | Server Components e Server Actions mantêm o token no servidor (cookie HttpOnly); leituras com `cache: "no-store"` para dados de usuário; formulário dinâmico pela URL, sem buscar dados no navegador |
| Mobile | Cliente HTTP injetável permite testar com `MockClient` sem rede; falhas como uma classe por tipo deixam cada tela mostrar a mensagem certa; sessão Simplificada com token em memória e volta ao login no `401` |
| Integração e processo | Um contrato único e a regra no backend sustentam dois clientes diferentes sobre a mesma API; registrar prompt, análise e correção a cada passo; conferir a versão dos pacotes antes de aproveitar código gerado |

### 6.4 Autoavaliação

Nota: 7/10

Justificativa: o sistema funciona de ponta a ponta. A API tem 59 testes unitários e 50 e2e passando, com as regras de negócio em funções puras e o mesmo contrato servindo ao web e ao app. O app foi executado num celular Android e os registros feitos nele apareceram no cliente web. A nota não é maior por quatro motivos: os checkpoints 1, 2 e 3 não foram entregues nos prazos oficiais e o desenvolvimento só começou em 19/11/2026; o histórico do Git foi concentrado no fim, em commits temáticos de 26/11/2026; o app só rodou num aparelho no último dia, com o fluxo completo de devolução, reenvio e conclusão ainda não conferido nele, e com um erro de abertura automática do `flutter run` sem causa investigada; e boa parte do código foi gerada com IA, que eu revisei, corrigi e consigo explicar, mas que acelerou o trabalho mais do que eu teria conseguido sozinho. O uso de IA está registrado na seção 2.3, com prompt, análise e correção de cada passo.

---

## 7. Vídeo de apresentação

| Campo | Valor |
|---|---|
| Link | https://youtu.be/U3i5PyBSk9g |
| Duração | 11 min 41 s |
| Quem fala em cada parte | Ninguém fala: o vídeo é legendado, com texto na tela em cada parte |

---

## 8. Histórico de revisões

| Versão | Data | Descrição | Quem atualizou |
|---|---|---|---|
| 0.1 | 19/11/2026 | Criação do diário e registro da Etapa 2 | Hyago |
| 0.2 | 24/11/2026 | Registro das etapas 3 e 4 | Hyago |
| 1.0 | 26/11/2026 | Versão final | Hyago |
