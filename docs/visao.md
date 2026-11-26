# Documento de Visão

## Identificação

| Campo | Valor |
|---|---|
| Nome do projeto | Campo Conectado |
| Grupo | Trabalho individual, autorizado pelo professor por e-mail em 03/10/2026 |
| Integrantes | Hyago Tonelli |
| Disciplina | Programação Web e Mobile |
| Data de criação | 01/10/2026 |
| Última atualização | 26/11/2026 |
| Versão | 1.2 |

---

## 1. Introdução

### 1.1 Propósito do documento

Este documento descreve a visão do Campo Conectado: o problema que ele resolve, quem o usa, o que fica dentro e fora do escopo e por que ele tem um cliente web e um aplicativo mobile. Destina-se ao professor orientador e serve de base para o PRD (`docs/prd.md`) e para o contrato da API (`docs/contrato-api.md`).

### 1.2 Escopo do produto

O Campo Conectado gerencia os ensaios de campo de máquinas agrícolas: o teste de uma máquina numa área, durante o qual a engenharia de validação registra medições, falhas e uma avaliação técnica, para que a engenharia de produto decida se a máquina está aprovada. O tema é próprio, proposto ao professor por e-mail em 01/10/2026 (ver `docs/equipe.md`), e tem afinidade com o tema 5 do enunciado ("Inspeções e não conformidades").

O sistema irá:
- cadastrar áreas de ensaio e máquinas, com a ficha técnica definida pela linha de atuação da máquina (Distribuição, Pulverização ou Plantio);
- permitir ao engenheiro planejar um ensaio e atribuí-lo a um analista;
- permitir ao analista registrar, no campo e pelo celular, medições, falhas e a avaliação da Pulverização, e enviar o ensaio ao engenheiro;
- calcular na API as evidências do ensaio (temperatura máxima em relação ao limite da ficha, falhas por severidade, horas trabalhadas, diferença de capacidade operacional em relação à máquina concorrente) e conferir as regras de coerência antes do envio;
- permitir ao engenheiro revisar o ensaio enviado, devolvê-lo com comentário ou concluí-lo.

O sistema não irá (fora do escopo):
- teste de bandeja da Distribuição e simulação da faixa efetiva (modelados no banco, sem telas nem endpoints nesta versão);
- funcionar sem conexão (o app exige rede para registrar);
- auto-cadastro, recuperação ou troca de senha (os usuários vêm do seed);
- anexar fotos ou arquivos aos registros;
- gerar relatórios em PDF ou exportar planilhas;
- integrar com telemetria da máquina ou com sistemas da empresa.

### 1.3 Definições e siglas

| Termo | Definição |
|---|---|
| Ensaio de campo | Teste planejado de uma máquina numa área, com objetivo, data prevista e um analista responsável |
| Linha de atuação | Família da máquina (Distribuição, Pulverização, Plantio). Define os tipos aceitos, os campos da ficha e o que é avaliado |
| Ficha da máquina | Conjunto de campos técnicos pré-definidos pela linha (ex.: capacidade do tanque), com tipo, faixa e obrigatoriedade |
| Campo adicional | Dado livre (nome, valor, unidade) que o engenheiro acrescenta à ficha, até 20 por máquina |
| Analista de validação | Funcionário da engenharia de validação que executa o ensaio no campo |
| Medição | Valor de uma grandeza registrado durante o ensaio: temperatura do motor, temperatura do hidráulico, velocidade ou consumo de combustível |
| Falha | Ocorrência durante o ensaio, com severidade crítica, maior ou menor |
| Parecer de conformidade | Julgamento de um critério: Conforme, Conforme com ressalva ou Não conforme |
| Parecer final | Conclusão da avaliação: Aprovada, Aprovada com ressalva ou Reprovada |
| Evidência | Valor calculado pela API a partir dos registros, que embasa os pareceres |
| Devolução | Retorno do ensaio enviado ao analista, com o comentário do que corrigir |
| Horímetro | Contador de horas de uso da máquina |
| Capacidade operacional | Área trabalhada por hora (ha/h) |
| Máquina concorrente | Máquina de referência da comparação de eficiência. Na avaliação da Pulverização, o analista informa a capacidade operacional dela (ha/h) e a API calcula, com 1 casa decimal, quantos por cento a capacidade da máquina ensaiada está acima ou abaixo da concorrente |
| CU | Caso de uso (CU-W no web, CU-M no mobile) |
| MVP | Produto mínimo viável |

---

## 2. Posicionamento

### 2.1 Declaração do problema

| Campo | Descrição |
|---|---|
| O problema de | Registros de ensaio feitos em papel e planilhas soltas, preenchidos depois do campo, sem padrão por linha de máquina e sem conferência das regras técnicas |
| Afeta | Analistas de validação, que anotam no campo e redigitam no escritório, e engenheiros, que recebem dados incompletos e inconsistentes |
| Cujo impacto é | Retrabalho, dados perdidos ou digitados errado, pareceres sem evidência (ex.: máquina aprovada com falha crítica) e demora para concluir o ensaio |
| Uma solução adequada seria | Um sistema em que o engenheiro planeja e atribui o ensaio, o analista registra no próprio campo pelo celular, a API calcula as evidências e barra incoerências, e o engenheiro revisa e conclui no computador |

### 2.2 Declaração de posição do produto

- Para engenheiros de produto e analistas de validação de máquinas agrícolas
- Que precisam planejar ensaios, registrar dados no campo e decidir com base em evidências
- O Campo Conectado
- É um sistema web e mobile de gestão de ensaios de campo
- Que leva o registro para o momento e o lugar do ensaio e confere as regras técnicas antes da revisão
- Diferente de formulários em papel e planilhas consolidadas depois
- Nosso produto calcula as evidências na API e impede o envio de uma avaliação incoerente, como aprovar uma máquina com falha crítica

---

## 3. Partes interessadas

| Parte interessada | Papel | Interesse no sistema |
|---|---|---|
| Engenheiro de produto | Usuário do cliente web | Planejar ensaios, acompanhar e decidir com dados confiáveis |
| Analista de validação | Usuário do app mobile | Registrar no campo sem redigitar, saber o que falta para enviar |
| Gestão da engenharia | Interessado indireto | Rastreabilidade das decisões de aprovação de máquinas |
| Professor da disciplina | Avaliador | Projeto que exercita backend, web e mobile com regras além do CRUD |

---

## 4. Descrição dos usuários

### 4.1 Perfil: Engenheiro (`ENGENHEIRO`)

| Campo | Descrição |
|---|---|
| Descrição | Engenheiro de produto responsável pelas máquinas em validação |
| Responsabilidades | Cadastrar áreas e máquinas, planejar e atribuir ensaios, revisar, devolver e concluir |
| Contexto de uso | No escritório, sentado à mesa, com tela grande, teclado e tempo para comparar dados e preencher fichas longas |
| Nível técnico | Avançado |
| Frequência de uso | Diário |
| Principal necessidade | Ver o ensaio inteiro (medições, falhas, avaliação e evidências) de uma vez para decidir |

### 4.2 Perfil: Analista de validação (`ANALISTA`)

| Campo | Descrição |
|---|---|
| Descrição | Funcionário da engenharia de validação que acompanha a máquina no campo |
| Responsabilidades | Registrar medições e falhas, preencher a avaliação e enviar o ensaio |
| Contexto de uso | Em pé, na área de ensaio, ao lado da máquina, com o celular na mão, às vezes de luvas e com sinal de rede instável |
| Nível técnico | Intermediário |
| Frequência de uso | Diário durante os ensaios |
| Principal necessidade | Registrar rápido, no momento em que mede, e saber o que ainda falta para enviar |

---

## 5. Visão geral do produto

### 5.1 Perspectiva do produto

Sistema independente, que substitui o registro em papel e planilhas. É composto por uma API REST (NestJS e PostgreSQL), que concentra as regras de negócio, e dois clientes que a consomem: o web do engenheiro (Next.js) e o app do analista (Flutter). Não integra com outros sistemas nesta versão.

### 5.2 Por que dois clientes

O que acontece na tela grande, e por quê: cadastro de máquinas com fichas de até seis campos técnicos mais campos adicionais, planejamento do ensaio (escolher máquina, área, analista e data) e a revisão, que mostra lado a lado medições, falhas, evidências e pareceres. São tarefas de escritório, com muito dado na tela e decisões que pedem comparação; no celular seriam lentas e propensas a erro.

O que acontece no celular, e por quê: o registro do ensaio. O analista está no campo, ao lado da máquina, e precisa anotar a temperatura, a falha ou o parecer no momento em que acontece, sem computador. O app mostra só os ensaios atribuídos a ele e salva um critério por vez, porque o preenchimento é interrompido o tempo todo.

O que faz sentido existir nos dois: o login, a consulta do ensaio (situação, máquina, área, registros) e o histórico de devoluções. O engenheiro acompanha o andamento; o analista vê o comentário do que corrigir.

### 5.3 Capacidades principais

| # | Capacidade | Descrição resumida | Cliente principal |
|---|---|---|---|
| C01 | Cadastros | Áreas e máquinas com ficha por linha e campos adicionais | web |
| C02 | Planejamento | Planejar o ensaio e atribuí-lo a um analista | web |
| C03 | Registro em campo | Medições, falhas e avaliação da Pulverização, com envio ao engenheiro | mobile |
| C04 | Evidências e regras | Cálculos e conferências feitos pela API no envio e na conclusão | ambos (calculado na API) |
| C05 | Revisão e decisão | Revisar, devolver com comentário e concluir | web |
| C06 | Teste de bandeja | Uniformidade de distribuição (prioridade Média, fora desta versão) | mobile e web |

### 5.4 Suposições e dependências

Suposições:
- O analista tem um celular Android com acesso à rede da API durante o registro.
- Os usuários são poucos e criados pelo seed; não há auto-cadastro.
- Os campos de ficha de cada linha (seed) representam bem as máquinas reais e podem ser revisados sem mudar o código.

Dependências:
- PostgreSQL 18 (em Docker no desenvolvimento).
- Node 22 para a API e o web; Flutter 3.35 ou mais novo para o app.

---

## 6. Restrições

| Tipo | Restrição |
|---|---|
| Backend | NestJS 11 (Node 22 LTS) + Prisma 7 + PostgreSQL 18 |
| Cliente web | React 19 + Next.js 16 com App Router |
| Cliente mobile | Flutter 3 / Dart |
| Autenticação | JWT com guards no backend; sessão completa no cliente web; no app mobile, nível Simplificada (token só em memória) |
| Arquitetura | Regra de negócio no backend; clientes não acessam o banco |
| Controle de versão | Repositório único no GitHub, criado a partir do repositório-modelo da disciplina |
| Prazo | Etapas 0 a 5 conforme o calendário da turma, mais apresentação |
| Documentação | Markdown, versionada no mesmo repositório |
| Equipe | Trabalho individual: um integrante responde pelos três componentes |
| Ambiente | API e web rodam em qualquer máquina com Node e Docker; o app mobile é executado e testado numa máquina com Flutter e emulador ou celular Android |

---

## 7. Qualidade

| Atributo | Relevância para este sistema |
|---|---|
| Confiabilidade dos dados | A decisão de aprovar uma máquina depende dos registros; por isso as regras de coerência e as evidências ficam na API, e o cliente nunca envia resultados calculados |
| Tolerância a rede instável (mobile) | No campo o sinal cai; o app tem tempo limite de 10 s e mostra mensagens claras quando a chamada falha ("Sem conexão com o servidor.") |
| Usabilidade no campo (mobile) | Registro curto, uma tela por medição ou falha, um único botão para salvar a avaliação, números com vírgula e lista do que falta para enviar |
| Segurança | Senhas com hash, JWT com 1 hora de validade, perfis separados por guard; o analista só vê os próprios ensaios |
| Manutenibilidade | Camadas separadas (controller, service, Prisma), formato de erro único e testes automatizados das regras |

---

## 8. Histórico de revisões

| Versão | Data | Autor | Descrição da alteração |
|---|---|---|---|
| 1.0 | 01/10/2026 | Hyago Tonelli | Versão inicial do documento |
| 1.1 | 23/11/2026 | Hyago Tonelli | Preenchido a partir das decisões e do sistema implementado; Next.js 16 |
| 1.2 | 26/11/2026 | Hyago Tonelli | Revisão: tema próprio explicitado, termo "máquina concorrente" definido, restrições de ambiente generalizadas |
