import "server-only";
import { escrever, ler, Pagina } from "@/lib/api";
import type { Ensaio } from "@/lib/ensaios";

/**
 * Leituras da revisão (CU-W2): o que o analista registrou no ensaio e o que
 * a API calculou. Tudo vem pronto da API; o web não recalcula nada.
 */

export type Grandeza =
  | "TEMPERATURA_MOTOR"
  | "TEMPERATURA_HIDRAULICO"
  | "VELOCIDADE"
  | "CONSUMO_COMBUSTIVEL";

export type Severidade = "CRITICA" | "MAIOR" | "MENOR";

export type Parecer = "CONFORME" | "CONFORME_COM_RESSALVA" | "NAO_CONFORME";

export type ParecerFinal = "APROVADA" | "APROVADA_COM_RESSALVA" | "REPROVADA";

export type Medicao = {
  id: number;
  grandeza: Grandeza;
  valor: number;
  horimetro: number | null;
  observacao: string | null;
  registradaEm: string;
};

export type Falha = {
  id: number;
  descricao: string;
  componente: string | null;
  severidade: Severidade;
  horimetro: number | null;
  ocorridaEm: string;
};

type Temperatura = {
  maxima: number | null;
  limite: number | null;
  excedeu: boolean | null;
};

export type Avaliacao = {
  velocidade: number | null;
  terreno: string | null;
  horimetroInicial: number | null;
  horimetroFinal: number | null;
  capacidadeOperacional: number | null;
  capacidadeConcorrente: number | null;
  parecerFinal: ParecerFinal | null;
  justificativaFinal: string | null;
  criterios: {
    criterio: string;
    rotulo: string;
    parecer: Parecer | null;
    justificativa: string | null;
  }[];
  evidencias: {
    temperaturaMotor: Temperatura;
    temperaturaHidraulico: Temperatura;
    falhasPorSeveridade: Record<Severidade, number>;
    horasTrabalhadas: number | null;
    diferencaConcorrente: number | null;
  };
  pendencias: string[];
  progresso: { avaliados: number; total: number };
};

/** Limite de página da API; a revisão mostra até 100 registros de cada tipo. */
const TAMANHO_MAXIMO = 100;

export async function listarMedicoes(token: string, ensaioId: number) {
  return (await ler<Pagina<Medicao>>(
    `/ensaios/${ensaioId}/medicoes?tamanho=${TAMANHO_MAXIMO}`,
    token,
  ))!;
}

export async function listarFalhas(token: string, ensaioId: number) {
  return (await ler<Pagina<Falha>>(
    `/ensaios/${ensaioId}/falhas?tamanho=${TAMANHO_MAXIMO}`,
    token,
  ))!;
}

/** Só existe em ensaios de Pulverização. */
export function buscarAvaliacao(token: string, ensaioId: number) {
  return ler<Avaliacao>(`/ensaios/${ensaioId}/avaliacao`, token);
}

export async function buscarPendencias(
  token: string,
  ensaioId: number,
): Promise<string[]> {
  const resposta = await ler<{ pendencias: string[] }>(
    `/ensaios/${ensaioId}/pendencias`,
    token,
  );
  return resposta!.pendencias;
}

export function devolver(token: string, ensaioId: number, comentario: string) {
  return escrever<Ensaio>("POST", `/ensaios/${ensaioId}/devolver`, token, {
    comentario,
  });
}

export function concluir(token: string, ensaioId: number) {
  return escrever<Ensaio>("POST", `/ensaios/${ensaioId}/concluir`, token);
}
