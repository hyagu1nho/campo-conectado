import type { Grandeza, Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { carregarAvaliacao } from '../avaliacao/contexto';
import { conferirMedicoes } from './requisitos';

type Cliente = Prisma.TransactionClient | PrismaService;

/**
 * Tudo o que impede enviar ou concluir o ensaio: medições mínimas e, na
 * Pulverização, a avaliação completa e coerente. Lista vazia quer dizer
 * pronto. Consultas em sequência, porque pode rodar em transação interativa.
 */
export async function pendenciasDoEnsaio(
  cliente: Cliente,
  ensaioId: number,
): Promise<string[]> {
  const { maquina } = await cliente.ensaio.findUniqueOrThrow({
    where: { id: ensaioId },
    select: { maquina: { select: { linha: true } } },
  });
  const grupos = await cliente.medicao.groupBy({
    by: ['grandeza'],
    where: { ensaioId },
    _count: { _all: true },
  });
  const contagem: Partial<Record<Grandeza, number>> = {};
  for (const { grandeza, _count } of grupos) contagem[grandeza] = _count._all;

  const pendencias = conferirMedicoes(maquina.linha, contagem);
  if (maquina.linha === 'PULVERIZACAO') {
    const { pendencias: daAvaliacao } = await carregarAvaliacao(
      cliente,
      ensaioId,
    );
    pendencias.push(...daAvaliacao);
  }
  return pendencias;
}
