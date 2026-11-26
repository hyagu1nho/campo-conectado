import type {
  Criterio,
  Grandeza,
  Parecer,
  ParecerFinal,
  Severidade,
} from '../generated/prisma/client';

/** Avaliação já convertida para tipos simples (Decimal vira number). */
export interface DadosAvaliacao {
  velocidade: number | null;
  terreno: string | null;
  horimetroInicial: number | null;
  horimetroFinal: number | null;
  capacidadeOperacional: number | null;
  capacidadeConcorrente: number | null;
  parecerFinal: ParecerFinal | null;
  justificativaFinal: string | null;
  criterios: {
    criterio: Criterio;
    parecer: Parecer;
    justificativa: string | null;
  }[];
}

/** Rótulos na ordem em que o app apresenta os critérios. */
export const ROTULOS_CRITERIO: Record<Criterio, string> = {
  ESTABILIDADE_BARRAS: 'Estabilidade das barras',
  TEMPERATURA_MOTOR: 'Temperatura do motor',
  TEMPERATURA_HIDRAULICO: 'Temperatura do sistema hidráulico',
  DURABILIDADE: 'Durabilidade das peças',
  EFICIENCIA_CONCORRENTE: 'Eficiência comparada com a concorrente',
  OPERACAO: 'Operação',
  MANUTENCAO: 'Manutenção',
};

const CAMPOS_OBRIGATORIOS: [keyof DadosAvaliacao, string][] = [
  ['velocidade', 'Velocidade'],
  ['terreno', 'Terreno'],
  ['horimetroInicial', 'Horímetro inicial'],
  ['horimetroFinal', 'Horímetro final'],
  ['capacidadeOperacional', 'Capacidade operacional'],
  ['capacidadeConcorrente', 'Capacidade da concorrente'],
];

/** Só o parecer totalmente favorável dispensa justificativa. */
export function exigeJustificativa(parecer: Parecer | ParecerFinal): boolean {
  return parecer !== 'CONFORME' && parecer !== 'APROVADA';
}

const vazio = (texto: string | null) => !texto || texto.trim() === '';

export function horimetrosInvertidos(
  inicial: number | null,
  final: number | null,
): boolean {
  return inicial !== null && final !== null && final < inicial;
}

/**
 * Tudo o que impede o envio de um ensaio de Pulverização: campos que
 * faltam, justificativas obrigatórias e as regras de coerência. Lista
 * vazia quer dizer pronto para enviar.
 */
export function conferirEnvio(
  avaliacao: DadosAvaliacao | null,
  temFalhaCritica: boolean,
): string[] {
  if (!avaliacao) return ['A avaliação da Pulverização não foi preenchida'];
  const pendencias: string[] = [];

  for (const [campo, rotulo] of CAMPOS_OBRIGATORIOS) {
    if (avaliacao[campo] === null)
      pendencias.push(`Falta preencher: ${rotulo}`);
  }
  if (
    horimetrosInvertidos(avaliacao.horimetroInicial, avaliacao.horimetroFinal)
  ) {
    pendencias.push('O horímetro final deve ser maior ou igual ao inicial');
  }

  const porCriterio = new Map(avaliacao.criterios.map((c) => [c.criterio, c]));
  for (const [criterio, rotulo] of Object.entries(ROTULOS_CRITERIO)) {
    const avaliado = porCriterio.get(criterio as Criterio);
    if (!avaliado) {
      pendencias.push(`Falta o parecer de: ${rotulo}`);
    } else if (
      exigeJustificativa(avaliado.parecer) &&
      vazio(avaliado.justificativa)
    ) {
      pendencias.push(
        `${rotulo}: justificativa obrigatória quando o parecer não é CONFORME`,
      );
    }
  }

  if (!avaliacao.parecerFinal) {
    pendencias.push('Falta preencher: Parecer final');
  } else if (
    exigeJustificativa(avaliacao.parecerFinal) &&
    vazio(avaliacao.justificativaFinal)
  ) {
    pendencias.push(
      'Parecer final: justificativa obrigatória quando não é APROVADA',
    );
  }

  if (
    temFalhaCritica &&
    porCriterio.get('DURABILIDADE')?.parecer === 'CONFORME'
  ) {
    pendencias.push(
      'Com falha crítica registrada, a durabilidade das peças não pode ser CONFORME',
    );
  }
  const algumNaoConforme = avaliacao.criterios.some(
    (c) => c.parecer === 'NAO_CONFORME',
  );
  if (
    avaliacao.parecerFinal === 'APROVADA' &&
    (temFalhaCritica || algumNaoConforme)
  ) {
    pendencias.push(
      'Com falha crítica ou critério NAO_CONFORME, o parecer final não pode ser APROVADA',
    );
  }

  return pendencias;
}

export interface Temperatura {
  maxima: number | null;
  limite: number | null;
  excedeu: boolean | null;
}

export interface Evidencias {
  temperaturaMotor: Temperatura;
  temperaturaHidraulico: Temperatura;
  falhasPorSeveridade: Record<Severidade, number>;
  horasTrabalhadas: number | null;
  /** Percentual da capacidade operacional acima (+) ou abaixo (-) da concorrente. */
  diferencaConcorrente: number | null;
}

const arredondar = (valor: number, casas: number) =>
  Math.round(valor * 10 ** casas) / 10 ** casas;

function temperatura(maxima?: number, limite?: number | null): Temperatura {
  const m = maxima ?? null;
  const l = limite ?? null;
  return {
    maxima: m,
    limite: l,
    excedeu: m === null || l === null ? null : m > l,
  };
}

/** Evidências que a API calcula; o cliente nunca as envia. */
export function calcularEvidencias(entrada: {
  maximas: Partial<Record<Grandeza, number>>;
  limites: { motor: number | null; hidraulico: number | null };
  falhas: Severidade[];
  avaliacao: DadosAvaliacao | null;
}): Evidencias {
  const { maximas, limites, falhas, avaliacao } = entrada;
  const falhasPorSeveridade = { CRITICA: 0, MAIOR: 0, MENOR: 0 };
  for (const severidade of falhas) falhasPorSeveridade[severidade] += 1;

  const inicial = avaliacao?.horimetroInicial ?? null;
  const final = avaliacao?.horimetroFinal ?? null;
  const propria = avaliacao?.capacidadeOperacional ?? null;
  const concorrente = avaliacao?.capacidadeConcorrente ?? null;

  return {
    temperaturaMotor: temperatura(maximas.TEMPERATURA_MOTOR, limites.motor),
    temperaturaHidraulico: temperatura(
      maximas.TEMPERATURA_HIDRAULICO,
      limites.hidraulico,
    ),
    falhasPorSeveridade,
    horasTrabalhadas:
      inicial === null || final === null || final < inicial
        ? null
        : arredondar(final - inicial, 1),
    diferencaConcorrente:
      propria === null || !concorrente
        ? null
        : arredondar(((propria - concorrente) / concorrente) * 100, 1),
  };
}
