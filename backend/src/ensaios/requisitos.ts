import type { Grandeza, Linha } from '../generated/prisma/client';

export const ROTULOS_GRANDEZA: Record<Grandeza, string> = {
  TEMPERATURA_MOTOR: 'Temperatura do motor',
  TEMPERATURA_HIDRAULICO: 'Temperatura do sistema hidráulico',
  VELOCIDADE: 'Velocidade',
  CONSUMO_COMBUSTIVEL: 'Consumo de combustível',
};

const TODAS = Object.keys(ROTULOS_GRANDEZA) as Grandeza[];

/**
 * Mínimo de medições para enviar e concluir: ao menos uma de cada
 * grandeza exigida pela linha (decisão do autor). Hoje todas as linhas
 * exigem as quatro; fica por linha para poder mudar sem mexer na regra.
 */
export const GRANDEZAS_EXIGIDAS: Record<Linha, Grandeza[]> = {
  DISTRIBUICAO: TODAS,
  PULVERIZACAO: TODAS,
  PLANTIO: TODAS,
};

export function conferirMedicoes(
  linha: Linha,
  contagem: Partial<Record<Grandeza, number>>,
): string[] {
  return GRANDEZAS_EXIGIDAS[linha]
    .filter((grandeza) => !contagem[grandeza])
    .map(
      (grandeza) =>
        `Falta ao menos uma medição de: ${ROTULOS_GRANDEZA[grandeza]}`,
    );
}
