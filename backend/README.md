# Campo Conectado: API (backend)

API REST em NestJS 11, com Prisma 7 e PostgreSQL 18. Concentra as regras de negócio e os dados do sistema. O cliente web e o app mobile consomem os mesmos endpoints. O contrato completo está em `docs/contrato-api.md`, e o passo a passo para subir os três componentes está no `README.md` da raiz.

## Subir só a API

Com o banco no ar (`docker compose up -d`, na raiz):

```bash
cd backend
cp .env.example .env
npm ci
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run start:dev
```

A API responde em `http://localhost:3000`. A documentação interativa (Swagger) fica em `http://localhost:3000/docs`, e `GET /saude` confere a API e o banco.

No Prisma 7, o `prisma generate` não roda sozinho: o cliente é gerado em `src/generated/prisma`, fora do Git. O `prisma db seed` apaga e recria os dados de exemplo a cada execução.

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `JWT_SECRET` | Segredo de assinatura do token. Gere um valor próprio, nunca use o do exemplo |
| `CORS_ORIGIN` | Origens aceitas pelo navegador, separadas por vírgula |
| `PORT` | Porta da API (padrão 3000) |

O arquivo real `.env` fica fora do Git. Só o `.env.example` é versionado.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API com recarga automática |
| `npm run build` | Compila para `dist/` |
| `npm run start:prod` | Roda a versão compilada |
| `npm run lint` | Confere o estilo |
| `npm test` | Testes unitários das regras e dos services |
| `npm run test:e2e` | Testes da API de ponta a ponta, contra o banco com o seed (o banco precisa estar no ar) |

## Organização

```
src/
├── main.ts, app.module.ts, configurar-app.ts
├── comum/        filtro de erros, paginação e validadores
├── prisma/       cliente do Prisma como provider (com o adaptador PrismaPg)
├── saude/        GET /saude
├── auth/         login, perfil, guards por perfil
├── usuarios/     lista de usuários para atribuir o ensaio
├── areas/        áreas de ensaio
├── maquinas/     máquinas, ficha por linha e campos modelo
├── ensaios/      ensaios, ciclo de vida, pendências
├── medicoes/     medições do ensaio
├── falhas/       falhas do ensaio
└── avaliacao/    avaliação da Pulverização, evidências e coerência
prisma/           schema, migrations e seed
test/             testes e2e
```

As regras de negócio ficam em funções puras testadas (`maquinas/ficha.ts`, `ensaios/ciclo.ts`, `ensaios/requisitos.ts` e `avaliacao/regras.ts`).
