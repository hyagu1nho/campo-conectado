-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ENGENHEIRO', 'ANALISTA');

-- CreateEnum
CREATE TYPE "Linha" AS ENUM ('DISTRIBUICAO', 'PULVERIZACAO', 'PLANTIO');

-- CreateEnum
CREATE TYPE "TipoMaquina" AS ENUM ('ARRASTO', 'AUTOPROPELIDO', 'MONTADA');

-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('TEXTO', 'NUMERO', 'INTEIRO', 'BOOLEANO', 'OPCAO');

-- CreateEnum
CREATE TYPE "SituacaoEnsaio" AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'ENVIADO', 'DEVOLVIDO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "Grandeza" AS ENUM ('TEMPERATURA_MOTOR', 'TEMPERATURA_HIDRAULICO', 'VELOCIDADE', 'CONSUMO_COMBUSTIVEL');

-- CreateEnum
CREATE TYPE "Severidade" AS ENUM ('CRITICA', 'MAIOR', 'MENOR');

-- CreateEnum
CREATE TYPE "Criterio" AS ENUM ('ESTABILIDADE_BARRAS', 'TEMPERATURA_MOTOR', 'TEMPERATURA_HIDRAULICO', 'DURABILIDADE', 'EFICIENCIA_CONCORRENTE', 'OPERACAO', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "Parecer" AS ENUM ('CONFORME', 'CONFORME_COM_RESSALVA', 'NAO_CONFORME');

-- CreateEnum
CREATE TYPE "ParecerFinal" AS ENUM ('APROVADA', 'APROVADA_COM_RESSALVA', 'REPROVADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "localizacao" VARCHAR(200) NOT NULL,
    "hectares" DECIMAL(10,2),
    "tipoSolo" VARCHAR(80),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maquina" (
    "id" SERIAL NOT NULL,
    "modelo" VARCHAR(120) NOT NULL,
    "numeroSerie" VARCHAR(60) NOT NULL,
    "linha" "Linha" NOT NULL,
    "tipo" "TipoMaquina" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoModelo" (
    "id" SERIAL NOT NULL,
    "linha" "Linha" NOT NULL,
    "chave" VARCHAR(60) NOT NULL,
    "rotulo" VARCHAR(120) NOT NULL,
    "tipo" "TipoCampo" NOT NULL,
    "unidade" VARCHAR(20),
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "minimo" DECIMAL(12,3),
    "maximo" DECIMAL(12,3),
    "opcoes" TEXT[],
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "CampoModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValorCampo" (
    "id" SERIAL NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "campoModeloId" INTEGER NOT NULL,
    "valor" VARCHAR(200) NOT NULL,

    CONSTRAINT "ValorCampo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoAdicional" (
    "id" SERIAL NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "valor" VARCHAR(200) NOT NULL,
    "unidade" VARCHAR(20),

    CONSTRAINT "CampoAdicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ensaio" (
    "id" SERIAL NOT NULL,
    "objetivo" VARCHAR(200) NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,
    "engenheiroId" INTEGER NOT NULL,
    "analistaId" INTEGER NOT NULL,
    "dataPrevista" DATE NOT NULL,
    "situacao" "SituacaoEnsaio" NOT NULL DEFAULT 'PLANEJADO',
    "enviadoEm" TIMESTAMP(3),
    "concluidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ensaio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devolucao" (
    "id" SERIAL NOT NULL,
    "ensaioId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicao" (
    "id" SERIAL NOT NULL,
    "ensaioId" INTEGER NOT NULL,
    "grandeza" "Grandeza" NOT NULL,
    "valor" DECIMAL(10,3) NOT NULL,
    "horimetro" DECIMAL(10,1),
    "observacao" TEXT,
    "registradaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Falha" (
    "id" SERIAL NOT NULL,
    "ensaioId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "componente" VARCHAR(120),
    "severidade" "Severidade" NOT NULL,
    "horimetro" DECIMAL(10,1),
    "ocorridaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Falha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TesteBandeja" (
    "id" SERIAL NOT NULL,
    "ensaioId" INTEGER NOT NULL,
    "produto" VARCHAR(120),
    "doseAlvo" DECIMAL(10,3) NOT NULL,
    "larguraFaixa" DECIMAL(6,2) NOT NULL,
    "espacamentoBandeja" DECIMAL(6,2) NOT NULL,
    "areaBandeja" DECIMAL(8,4) NOT NULL,
    "limiteCv" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TesteBandeja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColetaBandeja" (
    "id" SERIAL NOT NULL,
    "testeBandejaId" INTEGER NOT NULL,
    "posicao" DECIMAL(6,2) NOT NULL,
    "massa" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "ColetaBandeja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoPulverizacao" (
    "id" SERIAL NOT NULL,
    "ensaioId" INTEGER NOT NULL,
    "velocidade" DECIMAL(6,2),
    "terreno" VARCHAR(120),
    "horimetroInicial" DECIMAL(10,1),
    "horimetroFinal" DECIMAL(10,1),
    "capacidadeOperacional" DECIMAL(8,2),
    "capacidadeConcorrente" DECIMAL(8,2),
    "parecerFinal" "ParecerFinal",
    "justificativaFinal" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoPulverizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioAvaliado" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "criterio" "Criterio" NOT NULL,
    "parecer" "Parecer" NOT NULL,
    "justificativa" TEXT,

    CONSTRAINT "CriterioAvaliado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nome_key" ON "Area"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Maquina_numeroSerie_key" ON "Maquina"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "CampoModelo_linha_chave_key" ON "CampoModelo"("linha", "chave");

-- CreateIndex
CREATE INDEX "ValorCampo_campoModeloId_idx" ON "ValorCampo"("campoModeloId");

-- CreateIndex
CREATE UNIQUE INDEX "ValorCampo_maquinaId_campoModeloId_key" ON "ValorCampo"("maquinaId", "campoModeloId");

-- CreateIndex
CREATE UNIQUE INDEX "CampoAdicional_maquinaId_nome_key" ON "CampoAdicional"("maquinaId", "nome");

-- CreateIndex
CREATE INDEX "Ensaio_maquinaId_idx" ON "Ensaio"("maquinaId");

-- CreateIndex
CREATE INDEX "Ensaio_areaId_idx" ON "Ensaio"("areaId");

-- CreateIndex
CREATE INDEX "Ensaio_engenheiroId_idx" ON "Ensaio"("engenheiroId");

-- CreateIndex
CREATE INDEX "Ensaio_analistaId_situacao_idx" ON "Ensaio"("analistaId", "situacao");

-- CreateIndex
CREATE INDEX "Devolucao_ensaioId_idx" ON "Devolucao"("ensaioId");

-- CreateIndex
CREATE INDEX "Devolucao_autorId_idx" ON "Devolucao"("autorId");

-- CreateIndex
CREATE INDEX "Medicao_ensaioId_grandeza_idx" ON "Medicao"("ensaioId", "grandeza");

-- CreateIndex
CREATE INDEX "Falha_ensaioId_idx" ON "Falha"("ensaioId");

-- CreateIndex
CREATE UNIQUE INDEX "TesteBandeja_ensaioId_key" ON "TesteBandeja"("ensaioId");

-- CreateIndex
CREATE UNIQUE INDEX "ColetaBandeja_testeBandejaId_posicao_key" ON "ColetaBandeja"("testeBandejaId", "posicao");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoPulverizacao_ensaioId_key" ON "AvaliacaoPulverizacao"("ensaioId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioAvaliado_avaliacaoId_criterio_key" ON "CriterioAvaliado"("avaliacaoId", "criterio");

-- AddForeignKey
ALTER TABLE "ValorCampo" ADD CONSTRAINT "ValorCampo_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValorCampo" ADD CONSTRAINT "ValorCampo_campoModeloId_fkey" FOREIGN KEY ("campoModeloId") REFERENCES "CampoModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoAdicional" ADD CONSTRAINT "CampoAdicional_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_engenheiroId_fkey" FOREIGN KEY ("engenheiroId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucao" ADD CONSTRAINT "Devolucao_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucao" ADD CONSTRAINT "Devolucao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicao" ADD CONSTRAINT "Medicao_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Falha" ADD CONSTRAINT "Falha_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesteBandeja" ADD CONSTRAINT "TesteBandeja_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColetaBandeja" ADD CONSTRAINT "ColetaBandeja_testeBandejaId_fkey" FOREIGN KEY ("testeBandejaId") REFERENCES "TesteBandeja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoPulverizacao" ADD CONSTRAINT "AvaliacaoPulverizacao_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioAvaliado" ADD CONSTRAINT "CriterioAvaliado_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "AvaliacaoPulverizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
