/** Rótulos em português dos valores de enum da API. */

export type Linha = "DISTRIBUICAO" | "PULVERIZACAO" | "PLANTIO";
export type TipoMaquina = "ARRASTO" | "AUTOPROPELIDO" | "MONTADA";

export const ROTULO_LINHA: Record<Linha, string> = {
  DISTRIBUICAO: "Distribuição",
  PULVERIZACAO: "Pulverização",
  PLANTIO: "Plantio",
};

export const ROTULO_TIPO: Record<TipoMaquina, string> = {
  ARRASTO: "Arrasto",
  AUTOPROPELIDO: "Autopropelido",
  MONTADA: "Montada",
};

export const LINHAS = Object.keys(ROTULO_LINHA) as Linha[];

export type Situacao =
  "PLANEJADO" | "EM_ANDAMENTO" | "ENVIADO" | "DEVOLVIDO" | "CONCLUIDO";

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  ENVIADO: "Enviado",
  DEVOLVIDO: "Devolvido",
  CONCLUIDO: "Concluído",
};

export const SITUACOES = Object.keys(ROTULO_SITUACAO) as Situacao[];

export function ehSituacao(valor: unknown): valor is Situacao {
  return typeof valor === "string" && valor in ROTULO_SITUACAO;
}

/**
 * Grandezas medidas no campo. A API guarda só o número; a unidade é a
 * combinada para o registro no app (°C, km/h e L/h).
 */
export const ROTULO_GRANDEZA = {
  TEMPERATURA_MOTOR: { rotulo: "Temperatura do motor", unidade: "°C" },
  TEMPERATURA_HIDRAULICO: {
    rotulo: "Temperatura do sistema hidráulico",
    unidade: "°C",
  },
  VELOCIDADE: { rotulo: "Velocidade", unidade: "km/h" },
  CONSUMO_COMBUSTIVEL: { rotulo: "Consumo de combustível", unidade: "L/h" },
} as const;

export const ROTULO_SEVERIDADE = {
  CRITICA: "Crítica",
  MAIOR: "Maior",
  MENOR: "Menor",
} as const;

export const ROTULO_PARECER = {
  CONFORME: "Conforme",
  CONFORME_COM_RESSALVA: "Conforme com ressalva",
  NAO_CONFORME: "Não conforme",
} as const;

export const ROTULO_PARECER_FINAL = {
  APROVADA: "Aprovada",
  APROVADA_COM_RESSALVA: "Aprovada com ressalva",
  REPROVADA: "Reprovada",
} as const;

/** Número no formato brasileiro, ou "-" quando não informado. */
export function numero(valor: number | null, unidade = ""): string {
  if (valor === null) return "-";
  return `${valor.toLocaleString("pt-BR")}${unidade ? ` ${unidade}` : ""}`;
}

/** "2026-12-01" vira "01/12/2026", sem passar por Date (evita erro de fuso). */
export function dataBrasileira(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data e hora no fuso do Brasil, para enviadoEm, concluidoEm e devoluções. */
export function dataHoraBrasileira(instante: string): string {
  return new Date(instante).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ehLinha(valor: unknown): valor is Linha {
  return typeof valor === "string" && valor in ROTULO_LINHA;
}
