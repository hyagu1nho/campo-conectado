import { BadRequestException } from '@nestjs/common';
import type { Grandeza, Linha, Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import {
  calcularEvidencias,
  conferirEnvio,
  DadosAvaliacao,
  Evidencias,
} from './regras';

type Cliente = Prisma.TransactionClient | PrismaService;

const CHAVES_LIMITE = ['limiteTemperaturaMotor', 'limiteTemperaturaHidraulico'];

export interface ContextoAvaliacao {
  linha: Linha;
  dados: DadosAvaliacao | null;
  evidencias: Evidencias;
  pendencias: string[];
}

export function garantirPulverizacao(linha: Linha) {
  if (linha !== 'PULVERIZACAO') {
    throw new BadRequestException(
      'A avaliação só existe em ensaios de máquinas da linha PULVERIZACAO',
    );
  }
}

/**
 * Junta o que a avaliação precisa: os dados preenchidos, as evidências
 * calculadas a partir das medições, das falhas e da ficha da máquina, e as
 * pendências para o envio. O ensaio já deve ter sido conferido (existe e o
 * usuário tem acesso).
 */
export async function carregarAvaliacao(
  cliente: Cliente,
  ensaioId: number,
): Promise<ContextoAvaliacao> {
  // Em sequência: dentro de transação interativa a conexão é uma só, e
  // consultas simultâneas nela não são suportadas pelo driver pg.
  const ensaio = await cliente.ensaio.findUniqueOrThrow({
    where: { id: ensaioId },
    select: {
      maquina: {
        select: {
          linha: true,
          valores: {
            where: { campoModelo: { chave: { in: CHAVES_LIMITE } } },
            include: { campoModelo: { select: { chave: true } } },
          },
        },
      },
      avaliacao: { include: { criterios: true } },
    },
  });
  const maximas = await cliente.medicao.groupBy({
    by: ['grandeza'],
    where: { ensaioId },
    _max: { valor: true },
  });
  const falhas = await cliente.falha.findMany({
    where: { ensaioId },
    select: { severidade: true },
  });

  const limite = (chave: string) => {
    const valor = ensaio.maquina.valores.find(
      (v) => v.campoModelo.chave === chave,
    )?.valor;
    return valor === undefined ? null : Number(valor);
  };
  const maximasPorGrandeza: Partial<Record<Grandeza, number>> = {};
  for (const { grandeza, _max } of maximas) {
    if (_max.valor) maximasPorGrandeza[grandeza] = _max.valor.toNumber();
  }

  const dados = paraDados(ensaio.avaliacao);
  const severidades = falhas.map((f) => f.severidade);
  return {
    linha: ensaio.maquina.linha,
    dados,
    evidencias: calcularEvidencias({
      maximas: maximasPorGrandeza,
      limites: {
        motor: limite('limiteTemperaturaMotor'),
        hidraulico: limite('limiteTemperaturaHidraulico'),
      },
      falhas: severidades,
      avaliacao: dados,
    }),
    pendencias: conferirEnvio(dados, severidades.includes('CRITICA')),
  };
}

type AvaliacaoDoBanco = Prisma.AvaliacaoPulverizacaoGetPayload<{
  include: { criterios: true };
}>;

function paraDados(avaliacao: AvaliacaoDoBanco | null): DadosAvaliacao | null {
  if (!avaliacao) return null;
  const numero = (valor: Prisma.Decimal | null) => valor?.toNumber() ?? null;
  return {
    velocidade: numero(avaliacao.velocidade),
    terreno: avaliacao.terreno,
    horimetroInicial: numero(avaliacao.horimetroInicial),
    horimetroFinal: numero(avaliacao.horimetroFinal),
    capacidadeOperacional: numero(avaliacao.capacidadeOperacional),
    capacidadeConcorrente: numero(avaliacao.capacidadeConcorrente),
    parecerFinal: avaliacao.parecerFinal,
    justificativaFinal: avaliacao.justificativaFinal,
    criterios: avaliacao.criterios.map(
      ({ criterio, parecer, justificativa }) => ({
        criterio,
        parecer,
        justificativa,
      }),
    ),
  };
}
