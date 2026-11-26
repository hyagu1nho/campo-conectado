/**
 * Seed reprodutivel do Campo Conectado.
 * Roda com: npx prisma db seed   (no Prisma 7 o seed nao roda sozinho no migrate)
 *
 * Apaga tudo e recria: usuarios de teste, campos pre-prontos de cada linha,
 * areas, uma maquina por linha e ensaios de exemplo.
 * As senhas abaixo sao de DESENVOLVIMENTO e existem so neste banco local.
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Linha,
  Perfil,
  PrismaClient,
  TipoCampo,
  TipoMaquina,
} from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const CUSTO_HASH = 10;

type CampoSeed = {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  unidade?: string;
  obrigatorio?: boolean;
  minimo?: number;
  maximo?: number;
  opcoes?: string[];
};

// Proposta inicial dos campos de cada linha: revisar com o autor (decisoes.md 2.3).
const CAMPOS_POR_LINHA: Record<Linha, CampoSeed[]> = {
  DISTRIBUICAO: [
    { chave: 'capacidadeReservatorio', rotulo: 'Capacidade do reservatório', tipo: TipoCampo.NUMERO, unidade: 'kg', minimo: 500, maximo: 20000 },
    { chave: 'larguraMaximaDistribuicao', rotulo: 'Largura máxima de distribuição', tipo: TipoCampo.NUMERO, unidade: 'm', minimo: 6, maximo: 48 },
    { chave: 'quantidadeDiscos', rotulo: 'Quantidade de discos', tipo: TipoCampo.INTEIRO, minimo: 1, maximo: 4 },
    { chave: 'sistemaDosagem', rotulo: 'Sistema de dosagem', tipo: TipoCampo.OPCAO, opcoes: ['Esteira', 'Corrente'] },
    { chave: 'taxaVariavel', rotulo: 'Aplicação em taxa variável', tipo: TipoCampo.BOOLEANO, obrigatorio: false },
  ],
  PULVERIZACAO: [
    { chave: 'capacidadeTanque', rotulo: 'Capacidade do tanque', tipo: TipoCampo.NUMERO, unidade: 'L', minimo: 600, maximo: 6000 },
    { chave: 'comprimentoBarras', rotulo: 'Comprimento das barras', tipo: TipoCampo.NUMERO, unidade: 'm', minimo: 12, maximo: 50 },
    { chave: 'espacamentoBicos', rotulo: 'Espaçamento entre bicos', tipo: TipoCampo.NUMERO, unidade: 'cm', minimo: 25, maximo: 100 },
    { chave: 'potenciaMotor', rotulo: 'Potência do motor', tipo: TipoCampo.NUMERO, unidade: 'cv', minimo: 100, maximo: 400 },
    { chave: 'limiteTemperaturaMotor', rotulo: 'Limite de temperatura do motor', tipo: TipoCampo.NUMERO, unidade: '°C', minimo: 80, maximo: 120 },
    { chave: 'limiteTemperaturaHidraulico', rotulo: 'Limite de temperatura do sistema hidráulico', tipo: TipoCampo.NUMERO, unidade: '°C', minimo: 60, maximo: 100 },
  ],
  PLANTIO: [
    { chave: 'numeroLinhas', rotulo: 'Número de linhas', tipo: TipoCampo.INTEIRO, minimo: 4, maximo: 91 },
    { chave: 'espacamentoLinhas', rotulo: 'Espaçamento entre linhas', tipo: TipoCampo.NUMERO, unidade: 'cm', minimo: 17, maximo: 100 },
    { chave: 'sistemaDosador', rotulo: 'Sistema dosador', tipo: TipoCampo.OPCAO, opcoes: ['Pneumático', 'Mecânico', 'Elétrico'] },
    { chave: 'capacidadeSementes', rotulo: 'Capacidade do depósito de sementes', tipo: TipoCampo.NUMERO, unidade: 'L', minimo: 50, maximo: 5000 },
  ],
};

async function limpar() {
  // Dependentes primeiro, para nao violar chaves estrangeiras.
  await prisma.criterioAvaliado.deleteMany();
  await prisma.avaliacaoPulverizacao.deleteMany();
  await prisma.coletaBandeja.deleteMany();
  await prisma.testeBandeja.deleteMany();
  await prisma.medicao.deleteMany();
  await prisma.falha.deleteMany();
  await prisma.devolucao.deleteMany();
  await prisma.ensaio.deleteMany();
  await prisma.valorCampo.deleteMany();
  await prisma.campoAdicional.deleteMany();
  await prisma.maquina.deleteMany();
  await prisma.campoModelo.deleteMany();
  await prisma.area.deleteMany();
  await prisma.usuario.deleteMany();
}

async function criarUsuarios() {
  const usuario = async (nome: string, email: string, senha: string, perfil: Perfil) =>
    prisma.usuario.create({
      data: { nome, email, perfil, senhaHash: await bcrypt.hash(senha, CUSTO_HASH) },
    });

  const engenheiro = await usuario('Eduarda Engenheira', 'engenheiro@campo.dev', 'engenheiro123', Perfil.ENGENHEIRO);
  const analista = await usuario('Artur Analista', 'analista@campo.dev', 'analista123', Perfil.ANALISTA);
  const analista2 = await usuario('Bianca Analista', 'analista2@campo.dev', 'analista123', Perfil.ANALISTA);
  return { engenheiro, analista, analista2 };
}

async function criarCamposModelo() {
  for (const linha of Object.values(Linha)) {
    await prisma.campoModelo.createMany({
      data: CAMPOS_POR_LINHA[linha].map((campo, indice) => ({
        linha,
        chave: campo.chave,
        rotulo: campo.rotulo,
        tipo: campo.tipo,
        unidade: campo.unidade ?? null,
        obrigatorio: campo.obrigatorio ?? true,
        minimo: campo.minimo ?? null,
        maximo: campo.maximo ?? null,
        opcoes: campo.opcoes ?? [],
        ordem: indice + 1,
      })),
    });
  }
}

/** Cria a maquina ja com os valores da ficha, a partir das chaves dos campos. */
async function criarMaquina(
  modelo: string,
  numeroSerie: string,
  linha: Linha,
  tipo: TipoMaquina,
  valores: Record<string, string>,
) {
  const campos = await prisma.campoModelo.findMany({ where: { linha } });
  return prisma.maquina.create({
    data: {
      modelo,
      numeroSerie,
      linha,
      tipo,
      valores: {
        create: campos
          .filter((campo) => valores[campo.chave] !== undefined)
          .map((campo) => ({
            campoModelo: { connect: { id: campo.id } },
            valor: valores[campo.chave],
          })),
      },
    },
  });
}

async function main() {
  await limpar();
  const { engenheiro, analista } = await criarUsuarios();
  await criarCamposModelo();

  const areaNorte = await prisma.area.create({
    data: { nome: 'Área Norte', localizacao: 'Campo experimental, talhão 3', hectares: 42.5, tipoSolo: 'Latossolo vermelho' },
  });
  // Area com os opcionais vazios, para exercitar esse caminho.
  await prisma.area.create({ data: { nome: 'Área Sul', localizacao: 'Campo experimental, talhão 7' } });

  const pulverizador = await criarMaquina('Pulverizador P-3000', 'PV-0001', Linha.PULVERIZACAO, TipoMaquina.AUTOPROPELIDO, {
    capacidadeTanque: '3000',
    comprimentoBarras: '36',
    espacamentoBicos: '50',
    potenciaMotor: '250',
    limiteTemperaturaMotor: '105',
    limiteTemperaturaHidraulico: '85',
  });
  const distribuidor = await criarMaquina('Distribuidor D-10', 'DS-0001', Linha.DISTRIBUICAO, TipoMaquina.ARRASTO, {
    capacidadeReservatorio: '10000',
    larguraMaximaDistribuicao: '36',
    quantidadeDiscos: '2',
    sistemaDosagem: 'Esteira',
  });
  // Plantadeira sem ensaio e com campo adicional: pode trocar de linha.
  const plantadeira = await criarMaquina('Plantadeira PL-20', 'PL-0001', Linha.PLANTIO, TipoMaquina.ARRASTO, {
    numeroLinhas: '20',
    espacamentoLinhas: '45',
    sistemaDosador: 'Pneumático',
    capacidadeSementes: '800',
  });
  await prisma.campoAdicional.create({
    data: { maquinaId: plantadeira.id, nome: 'Marcador de linha', valor: 'Hidráulico' },
  });

  await prisma.ensaio.create({
    data: {
      objetivo: 'Avaliar desempenho do pulverizador em operação contínua',
      maquinaId: pulverizador.id,
      areaId: areaNorte.id,
      engenheiroId: engenheiro.id,
      analistaId: analista.id,
      dataPrevista: new Date('2026-12-01'),
    },
  });
  await prisma.ensaio.create({
    data: {
      objetivo: 'Verificar uniformidade de distribuição de fertilizante',
      maquinaId: distribuidor.id,
      areaId: areaNorte.id,
      engenheiroId: engenheiro.id,
      analistaId: analista.id,
      dataPrevista: new Date('2026-12-03'),
    },
  });

  console.log('Seed concluído.');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
