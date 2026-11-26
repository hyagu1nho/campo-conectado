# Equipe: composição e registro de contribuições

O registro aqui não substitui o histórico do Git; ele explica o histórico. Como o trabalho é individual, este documento serve para mostrar como os três componentes foram conduzidos por uma pessoa e onde entrou o apoio de IA (detalhado em `docs/relatorio.md`, seção 2.3).

---

## 1. Identificação

| Campo | Valor |
|---|---|
| Projeto | Campo Conectado |
| Grupo | Trabalho individual, autorizado pelo professor por e-mail em 03/10/2026 (pedido enviado em 01/10/2026) |
| Tema escolhido | Proposta própria: gestão de ensaios de campo de máquinas agrícolas (com afinidade com o tema 5, "Inspeções e não conformidades") |
| Repositório | `https://github.com/hyagu1nho/campo-conectado` |
| Data de formação | 01/10/2026 |

---

## 2. Integrantes e papéis

| Integrante | Usuário GitHub | Responsabilidade principal | Componentes |
|---|---|---|---|
| Hyago Tonelli | `hyagu1nho` | Todos | Backend, cliente web e app mobile |

Com um integrante só, a regra dos dois componentes é cumprida por construção: o autor responde pelos três na apresentação. O professor autorizou o trabalho individual; o recorte do MVP foi reduzido para caber (4 casos de uso, teste de bandeja fora desta versão).

---

## 3. Combinados

| Tema | Combinado |
|---|---|
| Frequência de trabalho | Um passo do roteiro por vez (fatias verticais), cada um terminado com algo funcionando e verificado |
| Canal de comunicação | E-mail com o professor; dúvidas de conteúdo pelas aulas em `ensino.diegoinacio.com.br/dev-web-mobile` |
| Prazo interno antes do prazo oficial do checkpoint | Prazos oficiais: Checkpoint 1 em 24/09/2026, Checkpoint 2 em 22/10/2026, Checkpoint 3 em 19/11/2026 e entrega final em 26/11/2026; sem prazo interno separado, por ser trabalho individual |
| Revisão de código | Revisão própria de cada trecho antes do commit; lint, testes e build como portão |
| Mudança no contrato da API | Cada alteração de endpoint entra no histórico do contrato (`docs/contrato-api.md`, seção 7) |
| Travar por mais de um dia | Regra dos 45 minutos: documentação oficial, isolar o problema e só então pedir ajuda (professor ou IA, registrando no relatório) |
| Uso de IA | Como professor e revisor; todo uso registrado no `relatorio.md`, com prompt, trecho aproveitado e validação |

---

## 4. Registro por etapa

### Etapa 0: Concepção

Período: de 01/10/2026 a 03/10/2026

| Integrante | O que fez | Commits / PRs de referência |
|---|---|---|
| Hyago | Escolha do tema próprio e pedido de autorização para trabalho individual; definição do domínio (linhas de atuação, perfis, avaliação por parecer de conformidade no lugar de notas de 1 a 5); recorte do MVP em 4 casos de uso | Sem commits: etapa de planejamento, registrada no e-mail de 01/10/2026 |

Dificuldades de coordenação: não se aplica (trabalho individual).

Ajustes combinados para a próxima etapa: documentar antes só o essencial (PRD, contrato e modelo de dados) e evoluir o resto junto com o código.

---

### Etapa 1: Contrato e fundação

Período: 19/11/2026

| Integrante | O que fez | Componentes tocados | Commits / PRs de referência |
|---|---|---|---|
| Hyago | Modelo de dados com 14 entidades no `schema.prisma`, completo desde a primeira migration; ambiente com PostgreSQL 18 em Docker (correção do volume da versão 18) | Backend | `2cd7703` (modelo de dados) e `ec8ae46` (docker-compose e `.gitignore`) |

Dificuldades de coordenação: não se aplica.

Ajustes combinados para a próxima etapa: não se aplica.

---

### Etapa 2: Backend, Checkpoint 1

Período: 19/11/2026

| Integrante | O que fez | Componentes tocados | Commits / PRs de referência |
|---|---|---|---|
| Hyago | Passos 2.1 a 2.9: `GET /saude`; Prisma 7 com seed; CRUD de áreas como padrão (erro único, paginação, validação em português); login JWT com guards por perfil; máquinas com ficha validada por linha; ensaios com máquina de estados; medições e falhas; avaliação da Pulverização com evidências e regras de coerência; requisitos de envio e conclusão. 59 testes unitários e 50 e2e | Backend | `2cd7703`, `7e6e483`, `4b02dc4`, `75d49d0`; em 26/11, `fd3ae94` (ficha da linha Plantio) |

Como a revisão de código aconteceu nesta etapa: lint, testes e build a cada passo; regras de negócio com teste escrito antes do código (TDD) a partir do passo 2.5.

Dificuldades: incompatibilidade de pacotes da linha 12 com o NestJS 11 (fixadas as versões 11 e 4); imports do cliente gerado pelo Prisma 7 no Jest; teste e2e intermitente por suítes paralelas apagando dados umas das outras (prefixo por suíte).

---

### Etapa 3: Cliente web, Checkpoint 2

Período: de 19/11/2026 a 24/11/2026

| Integrante | O que fez | Componentes tocados | Commits / PRs de referência |
|---|---|---|---|
| Hyago | Passos 3.1 a 3.6: projeto Next.js 16 com `src/`; login com cookie HttpOnly e Server Actions; áreas; máquinas com formulário montado pela linha; planejamento de ensaios; revisão com devolver e concluir. Ajuste de CORS na API | Web, backend | `96a275e`, `6b47469`; em 26/11, `d1bfcf7` (cabeçalho, espaçamento e tipografia) |

Como a revisão de código aconteceu nesta etapa: lint, `tsc --noEmit` e build a cada passo; cada fluxo testado no navegador com os usuários do seed.

Dificuldades: divergência de versão entre README (Next 16 com `src/`), PRD (Next 15) e aulas (Next 16 sem `src/`), resolvida pelo README; o padrão do `create-next-app` 16.4 trazia um modelo de cache diferente do das aulas.

---

### Etapa 4: App mobile, Checkpoint 3

Período: de 23/11/2026 a 26/11/2026

| Integrante | O que fez | Componentes tocados | Commits / PRs de referência |
|---|---|---|---|
| Hyago | Passos 4.0 a 4.4 escritos: primeira chamada à API, login no nível Simplificada, meus ensaios, medição e falha, avaliação da Pulverização e envio; testes com `MockClient`. API passou a aceitar lista de origens no CORS | Mobile, backend | `78b93c5`, `79aa312`; em 26/11, `46d23fe` (manifests do Android) |

Como a revisão de código aconteceu nesta etapa: `flutter analyze` e `flutter test` sem erros; execução em dispositivo em 26/11/2026, num Samsung SM M556B.

Dificuldades: o código foi escrito antes de haver um ambiente com Flutter configurado, e o emulador Android não iniciou de forma estável na máquina disponível. A execução em dispositivo só aconteceu em 26/11/2026, por cabo USB; o `flutter run` instala o app, mas a abertura automática falha com `MainActivity does not exist`; o app não tem ícone no aparelho e só é executado pelo `flutter run` no terminal.

---

### Etapa 5: Integração e fechamento

Período: 26/11/2026 (entrega final)

| Integrante | O que fez | Componentes tocados | Commits / PRs de referência |
|---|---|---|---|
| Hyago | Conferência do contrato da API contra os controllers (versão 1.3); testes do backend num clone limpo (59 unitários e 50 e2e); ajuste da ficha da linha Plantio; melhorias no cabeçalho e no espaçamento do web; correção dos manifests do Android; execução do app num celular Android; avaliação do app com um único botão para salvar; revisão do README e dos documentos; relatório | Backend, web, mobile | `46d23fe`, `fd3ae94`, `d1bfcf7` |

---

## 5. Cobertura por componente

| Integrante | Backend | Web | Mobile | Cumpre a regra dos dois componentes? |
|---|---|---|---|---|
| Hyago | 5 | 3 | 3 | Sim (único integrante, responde pelos três) |

---

## 6. Ocorrências

| Data | Ocorrência | Encaminhamento | Professor comunicado? |
|---|---|---|---|
| 01/10/2026 | Composição do grupo e proposta de tema entregues depois do prazo da Etapa 0 (03/09/2026) | Regularizado por e-mail, com pedido de autorização para trabalho individual | Sim |
| 03/10/2026 | Trabalho feito individualmente | Autorizado pelo professor por e-mail; recorte do MVP reduzido | Sim |
| 24/09/2026 e 22/10/2026 | Checkpoints 1 (backend) e 2 (web) sem entrega no prazo oficial; backend e web desenvolvidos a partir de 19/11/2026 | Código enviado ao repositório em 26/11/2026, em oito commits temáticos | Não |
| 23/11/2026 | Ambiente de desenvolvimento sem Flutter funcional na etapa de escrita do app | `flutter analyze` e `flutter test` executados sem erros depois; execução em dispositivo feita em 26/11/2026 (Samsung SM M556B) | Não |

---

## 7. Autoavaliação

O que funcionou na divisão de trabalho: como o trabalho foi individual, dividi em três frentes em sequência (backend, web e mobile), cada uma em passos pequenos, com lint, testes e build como portão. O contrato da API, fechado antes dos clientes, evitou retrabalho entre web e app, e deixar a regra de negócio só no backend fez os dois clientes mostrarem o que a API calcula.

O que não funcionou: não cumpri os checkpoints 1, 2 e 3 nos prazos oficiais, comecei o desenvolvimento em 19/11/2026 e concentrei o histórico do Git no fim. O Flutter não rodava na máquina de desenvolvimento inicial, então escrevi o app sem compilar e só o executei num aparelho no dia da entrega. Isso deixou o teste do app no celular para a última hora, com o fluxo de devolução, reenvio e conclusão ainda não conferido nele.

Se recomeçasse, o que dividiria de outro jeito: faria ciclos menores, com o web e o app conversando com a API desde a Etapa 3 e com commits diários. Configuraria o Flutter e rodaria o app em dispositivo logo no começo, em vez de deixar o mobile para o fim.
