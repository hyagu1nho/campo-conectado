import "server-only";
import { escrever, ler, Pagina } from "@/lib/api";
import type { DadosMaquina } from "@/lib/formulario-maquina";
import type { Linha, TipoMaquina } from "@/lib/rotulos";

export type TipoCampo = "TEXTO" | "NUMERO" | "INTEIRO" | "BOOLEANO" | "OPCAO";

/** Campo pré-pronto da ficha de uma linha (GET /campos-modelo). */
export type CampoModelo = {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  unidade: string | null;
  obrigatorio: boolean;
  minimo: number | null;
  maximo: number | null;
  opcoes: string[];
  ordem: number;
};

export type FormularioLinha = {
  linha: Linha;
  tipos: TipoMaquina[];
  campos: CampoModelo[];
};

export type MaquinaResumo = {
  id: number;
  modelo: string;
  numeroSerie: string;
  linha: Linha;
  tipo: TipoMaquina;
};

export type ItemFicha = {
  chave: string;
  rotulo: string;
  tipo: TipoCampo;
  unidade: string | null;
  valor: string | number | boolean;
};

export type CampoAdicional = {
  id: number;
  nome: string;
  valor: string;
  unidade: string | null;
};

export type Maquina = MaquinaResumo & {
  ficha: ItemFicha[];
  camposAdicionais: CampoAdicional[];
  criadoEm: string;
  atualizadoEm: string;
};

export const TAMANHO_DA_PAGINA = 10;

export async function formularioDaLinha(
  token: string,
  linha: Linha,
): Promise<FormularioLinha> {
  return (await ler<FormularioLinha>(`/campos-modelo?linha=${linha}`, token))!;
}

export async function listarMaquinas(
  token: string,
  filtros: { linha?: Linha; busca?: string; pagina: number },
): Promise<Pagina<MaquinaResumo>> {
  const consulta = new URLSearchParams({
    pagina: String(filtros.pagina),
    tamanho: String(TAMANHO_DA_PAGINA),
  });
  if (filtros.linha) consulta.set("linha", filtros.linha);
  if (filtros.busca) consulta.set("busca", filtros.busca);
  return (await ler<Pagina<MaquinaResumo>>(`/maquinas?${consulta}`, token))!;
}

export function buscarMaquina(token: string, id: number) {
  return ler<Maquina>(`/maquinas/${id}`, token);
}

export function criarMaquina(token: string, dados: DadosMaquina) {
  return escrever<Maquina>("POST", "/maquinas", token, dados);
}

/** A ficha e os campos adicionais vão inteiros e substituem os anteriores. */
export function atualizarMaquina(
  token: string,
  id: number,
  dados: DadosMaquina,
) {
  return escrever<Maquina>("PATCH", `/maquinas/${id}`, token, dados);
}

export function removerMaquina(token: string, id: number) {
  return escrever<void>("DELETE", `/maquinas/${id}`, token);
}

/** Máquinas para escolher num select (no máximo 100, o limite da API). */
export async function opcoesDeMaquinas(
  token: string,
): Promise<MaquinaResumo[]> {
  const pagina = await ler<Pagina<MaquinaResumo>>(
    "/maquinas?tamanho=100",
    token,
  );
  return pagina!.dados;
}
