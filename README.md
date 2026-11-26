# Campo Conectado

Gestão de ensaios de campo de máquinas agrícolas. O engenheiro planeja o ensaio e o atribui a um analista no cliente web; o analista registra medições, falhas e a avaliação no campo, pelo aplicativo mobile; a API calcula as evidências, confere as regras e o engenheiro revisa, devolve ou conclui.

Trabalho final de Programação Web e Mobile (UPF), feito individualmente com autorização do professor. Um serviço e dois clientes no mesmo repositório.

| Componente | Tecnologia | Pasta | Endereço em desenvolvimento |
|---|---|---|---|
| API REST | NestJS 11, Prisma 7, PostgreSQL 18 | `backend/` | `http://localhost:3000` (Swagger em `/docs`) |
| Cliente web (engenheiro) | Next.js 16, React 19, Tailwind 4 | `web/` | `http://localhost:3001` |
| App mobile (analista) | Flutter 3.35 ou mais novo | `mobile/` | Emulador Android, API em `http://10.0.2.2:3000`; celular, ver a seção 4 |
| Banco | PostgreSQL 18 em Docker | `docker-compose.yml` | `localhost:5432` |

---

## Estrutura

```
/
├── README.md
├── docker-compose.yml        ← PostgreSQL 18 local
├── docs/
│   ├── visao.md              ← Documento de Visão
│   ├── prd.md                ← Requisitos, regras, modelo de dados e recorte web/mobile
│   ├── contrato-api.md       ← Contrato REST da API (todos os endpoints)
│   ├── equipe.md             ← Composição e registro de contribuições
│   ├── relatorio.md          ← Diário técnico e registro do uso de IA
│   └── rfc-001.md            ← Mudança de requisito (só se o professor publicar)
├── backend/                  ← API NestJS (módulos por recurso, Prisma, seed, testes)
├── web/                      ← Cliente Next.js (App Router, Server Actions)
└── mobile/                   ← App Flutter (models, services, screens, widgets)
```

Os desvios em relação à estrutura sugerida pela disciplina estão em `docs/relatorio.md`, seção 4.1.

---

## Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| Node.js | 22 LTS | API e cliente web |
| Docker Desktop | atual | Banco PostgreSQL 18 |
| Flutter | 3.35 ou mais novo (Dart 3.9 ou mais novo) | App mobile |
| Android Studio | atual, com um emulador criado | Rodar o app |

No Windows, o Flutter usa o PowerShell para se preparar. Se ele estiver bloqueado na máquina, o app precisa ser executado em outra; a API e o web não dependem do Flutter.

---

## Subir do zero

Os comandos abaixo partem da raiz do repositório. No Windows, use o Git Bash, ou troque `cp` por `copy`.

### 1. Banco de dados

```bash
docker compose up -d
```

Sobe o PostgreSQL 18 com usuário `app`, senha `app` e banco `appdb` na porta 5432 (valores só de desenvolvimento). Confira com `docker ps`: o contêiner `campo-conectado-db` deve aparecer como `healthy`.

### 2. API (backend)

```bash
cd backend
cp .env.example .env          # depois troque o JWT_SECRET (comando no próprio arquivo)
npm ci
npx prisma migrate deploy     # cria as tabelas
npx prisma generate           # gera o cliente em src/generated (no Prisma 7 não é automático)
npx prisma db seed            # usuários, fichas das linhas, áreas, máquinas e ensaios de exemplo
npm run start:dev             # http://localhost:3000
```

Confira: `http://localhost:3000/saude` responde `{"status":"ok","banco":"ok"}`, e a documentação interativa está em `http://localhost:3000/docs`.

O seed apaga e recria os dados a cada execução: use-o para voltar ao estado inicial.

### 3. Cliente web

Em outro terminal:

```bash
cd web
cp .env.example .env.local    # API_URL=http://localhost:3000
npm ci
npm run dev                   # http://localhost:3001
```

Entre com o usuário engenheiro (abaixo). O web é só do engenheiro: o analista é recusado no login.

### 4. App mobile

Em outro terminal, numa máquina com Flutter. O repositório já traz a pasta `android/`, com a permissão de internet e o `usesCleartextTraffic` de debug (HTTP sem TLS, só em desenvolvimento). A pasta `ios/` não foi gerada.

```bash
cd mobile
flutter pub get
```

Com o emulador aberto e a API no ar:

```bash
flutter run --dart-define=API_URL=http://10.0.2.2:3000
```

No celular físico, ligado por cabo com a depuração USB ativa, encaminhe a porta da API e use `localhost`:

```bash
adb reverse tcp:3000 tcp:3000
flutter run --dart-define=API_URL=http://localhost:3000
```

Sem cabo, use o IP do computador na rede no lugar de `10.0.2.2`. Detalhes em `mobile/README.md`.

---

## Usuários de teste

Criados pelo seed (`backend/prisma/seed.ts`). São credenciais só do ambiente local.

| Perfil | E-mail | Senha | Usa |
|---|---|---|---|
| Engenheiro (Eduarda) | `engenheiro@campo.dev` | `engenheiro123` | Cliente web |
| Analista (Artur) | `analista@campo.dev` | `analista123` | App mobile; tem os 2 ensaios do seed |
| Analista (Bianca) | `analista2@campo.dev` | `analista123` | App mobile; começa sem ensaios |

Roteiro curto para ver o sistema de ponta a ponta:

1. No web, como engenheiro, abra Ensaios e veja os dois ensaios planejados para o Artur (um pulverizador e um distribuidor).
2. No app, como Artur, abra o ensaio do pulverizador, registre uma medição de cada grandeza, uma falha e a avaliação (critério a critério) e envie.
3. No web, abra o ensaio enviado: medições, falhas, evidências calculadas e pareceres. Devolva com um comentário ou conclua.

---

## Testes e verificação

| Onde | Comando | O que confere |
|---|---|---|
| `backend/` | `npm test` | Testes unitários das regras (ficha, ciclo do ensaio, requisitos, avaliação) e dos services |
| `backend/` | `npm run test:e2e` | A API de ponta a ponta contra o banco com o seed (o banco precisa estar no ar) |
| `backend/` | `npm run lint` e `npm run build` | Estilo e compilação |
| `web/` | `npm run lint`, `npm run build` e, depois do build, `npx tsc --noEmit` | Estilo, compilação e tipos (os tipos `PageProps` e `LayoutProps` do Next.js são gerados pelo build) |
| `mobile/` | `flutter analyze` e `flutter test` | Análise estática e testes com servidor falso (sem rede) |

Os testes e2e criam registros com prefixo próprio e os apagam no fim; o banco volta ao estado do seed.

---

## Variáveis de ambiente

Cada componente versiona um `.env.example`; o arquivo real (`.env` ou `.env.local`) fica fora do Git.

| Componente | Variável | Para quê |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | Conexão com o PostgreSQL |
| `backend/.env` | `JWT_SECRET` | Segredo de assinatura do token; gere um valor próprio, nunca use o do exemplo |
| `backend/.env` | `CORS_ORIGIN` | Origens aceitas por chamadas do navegador, separadas por vírgula (padrão: o web na 3001) |
| `backend/.env` | `PORT` | Porta da API (padrão 3000) |
| `web/.env.local` | `API_URL` | Endereço da API, lido só no servidor do Next.js |
| `mobile` | `--dart-define=API_URL=...` | Endereço da API, definido na hora de rodar |

---

## Convenções

- Domínio em português, termos técnicos em inglês: `Ensaio`, `Medicao`, `situacao`, `/ensaios`; `Controller`, `Service`, `Dto`, `Screen`.
- Identificadores sem acento nem cedilha: `Medicao`, não `Medição`. Textos de interface, mensagens de erro e documentação em português do Brasil, com acentuação normal.
- Erros da API sempre no formato `{ status, titulo, detalhes[], caminho, momento }`; listagens no formato `{ dados, pagina, tamanho, total, totalDePaginas }`. Detalhes em `docs/contrato-api.md`.
- Regra de negócio só no backend. Os clientes validam antes por conveniência, mas quem decide é a API.
- Commits no padrão `tipo(componente): descricao`, por exemplo `feat(backend): ...`, `feat(web): ...`, `docs: ...`.

---

## Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/visao.md` | Problema, usuários, escopo e por que existem dois clientes |
| `docs/prd.md` | Requisitos funcionais e não funcionais, regras de negócio, modelo de dados, recorte web/mobile e arquitetura |
| `docs/contrato-api.md` | Todos os endpoints: entrada, saída, status, erros, perfis e o ciclo do ensaio |
| `docs/equipe.md` | Registro do trabalho por etapa |
| `docs/relatorio.md` | Ambiente, uso de IA passo a passo, diário por etapa e arquitetura |

O enunciado completo (etapas, prazos e critérios de avaliação) está na página da disciplina.
