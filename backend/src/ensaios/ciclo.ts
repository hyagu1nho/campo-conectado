import type { SituacaoEnsaio } from '../generated/prisma/client';

export type AcaoEnsaio = 'INICIAR' | 'ENVIAR' | 'DEVOLVER' | 'CONCLUIR';

/**
 * Máquina de estados do ensaio. Cada ação só vale a partir de certas
 * situações e leva sempre a uma situação fixa.
 *
 * PLANEJADO -> EM_ANDAMENTO -> ENVIADO -> CONCLUIDO
 *                                 |  ^
 *                                 v  |
 *                               DEVOLVIDO
 */
const REGRAS: Record<
  AcaoEnsaio,
  { de: SituacaoEnsaio[]; para: SituacaoEnsaio; participio: string }
> = {
  INICIAR: { de: ['PLANEJADO'], para: 'EM_ANDAMENTO', participio: 'iniciado' },
  ENVIAR: {
    de: ['EM_ANDAMENTO', 'DEVOLVIDO'],
    para: 'ENVIADO',
    participio: 'enviado',
  },
  DEVOLVER: { de: ['ENVIADO'], para: 'DEVOLVIDO', participio: 'devolvido' },
  CONCLUIR: { de: ['ENVIADO'], para: 'CONCLUIDO', participio: 'concluído' },
};

export function transicao(
  acao: AcaoEnsaio,
  atual: SituacaoEnsaio,
): { para: SituacaoEnsaio } | { erro: string } {
  const regra = REGRAS[acao];
  if (regra.de.includes(atual)) return { para: regra.para };
  return {
    erro: `Ensaio ${atual} não pode ser ${regra.participio}; só ${regra.de.join(' ou ')}`,
  };
}

/**
 * Situações em que o analista pode registrar medições e falhas. Em
 * PLANEJADO o primeiro registro já inicia o ensaio.
 */
const ACEITAM_REGISTRO: SituacaoEnsaio[] = [
  'PLANEJADO',
  'EM_ANDAMENTO',
  'DEVOLVIDO',
];

/** Devolve null se a situação aceita registros, ou a mensagem de erro. */
export function conferirRegistro(situacao: SituacaoEnsaio): string | null {
  if (ACEITAM_REGISTRO.includes(situacao)) return null;
  return `Ensaio ${situacao} não aceita registros; só ${ACEITAM_REGISTRO.slice(0, -1).join(', ')} ou ${ACEITAM_REGISTRO.at(-1)}`;
}
