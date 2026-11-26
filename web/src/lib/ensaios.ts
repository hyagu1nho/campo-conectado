import "server-only";
import { escrever, ler, Pagina } from "@/lib/api";
import type { DadosEnsaio } from "@/lib/formulario-ensaio";
import { SITUACOES, type Linha, type Situacao } from "@/lib/rotulos";

type Pessoa = { id: number; nome: string };

export type EnsaioResumo = {
  id: number;
  objetivo: string;
  situacao: Situacao;
  /** AAAA-MM-DD, sem hora. */
  dataPrevista: string;
  maquina: { id: number; modelo: string; numeroSerie: string; linha: Linha };
  area: Pessoa;
  analista: Pessoa;
};

export type Devolucao = {
  id: number;
  comentario: string;
  autor: Pessoa;
  criadoEm: string;
};

export type Ensaio = EnsaioResumo & {
  engenheiro: Pessoa;
  enviadoEm: string | null;
  concluidoEm: string | null;
  devolucoes: Devolucao[];
  criadoEm: string;
  atualizadoEm: string;
};

export type Analista = { id: number; nome: string; email: string };

/** Limite de página da API: cada coluna do quadro mostra até 100 ensaios. */
const TAMANHO_MAXIMO = 100;

export type ColunaQuadro = {
  situacao: Situacao;
  ensaios: EnsaioResumo[];
  total: number;
};

async function listarPorFiltro(token: string, filtro: string) {
  return (await ler<Pagina<EnsaioResumo>>(
    `/ensaios?tamanho=${TAMANHO_MAXIMO}&${filtro}`,
    token,
  ))!;
}

/** Uma coluna por situação, buscadas em paralelo. */
export async function quadroDeEnsaios(token: string): Promise<ColunaQuadro[]> {
  const paginas = await Promise.all(
    SITUACOES.map((situacao) => listarPorFiltro(token, `situacao=${situacao}`)),
  );
  return SITUACOES.map((situacao, i) => ({
    situacao,
    ensaios: paginas[i].dados,
    total: paginas[i].total,
  }));
}

/** Ensaios de uma máquina (até 100). */
export async function ensaiosDaMaquina(token: string, maquinaId: number) {
  return (await listarPorFiltro(token, `maquinaId=${maquinaId}`)).dados;
}

/**
 * Ensaios de uma área. A API não filtra por área, então o web filtra os
 * 100 mais recentes.
 */
export async function ensaiosDaArea(token: string, areaId: number) {
  const pagina = await listarPorFiltro(token, "pagina=1");
  return pagina.dados.filter((ensaio) => ensaio.area.id === areaId);
}

export function buscarEnsaio(token: string, id: number) {
  return ler<Ensaio>(`/ensaios/${id}`, token);
}

/** Analistas para atribuir o ensaio (no máximo 100, o limite da API). */
export async function listarAnalistas(token: string): Promise<Analista[]> {
  const pagina = await ler<Pagina<Analista>>(
    "/usuarios?perfil=ANALISTA&tamanho=100",
    token,
  );
  return pagina!.dados;
}

export function criarEnsaio(token: string, dados: DadosEnsaio) {
  return escrever<Ensaio>("POST", "/ensaios", token, dados);
}

export function atualizarEnsaio(token: string, id: number, dados: DadosEnsaio) {
  return escrever<Ensaio>("PATCH", `/ensaios/${id}`, token, dados);
}

export function removerEnsaio(token: string, id: number) {
  return escrever<void>("DELETE", `/ensaios/${id}`, token);
}
