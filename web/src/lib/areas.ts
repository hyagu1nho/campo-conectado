import "server-only";
import { escrever, ler, Pagina } from "@/lib/api";
import type { DadosArea } from "@/lib/formulario-area";

export type Area = {
  id: number;
  nome: string;
  localizacao: string;
  hectares: number | null;
  tipoSolo: string | null;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export const TAMANHO_DA_PAGINA = 10;

export async function listarAreas(
  token: string,
  { nome, pagina }: { nome?: string; pagina: number },
): Promise<Pagina<Area>> {
  const consulta = new URLSearchParams({
    pagina: String(pagina),
    tamanho: String(TAMANHO_DA_PAGINA),
  });
  if (nome) consulta.set("nome", nome);
  // Listagem nunca dá 404; o `!` só agrada o tipo de `ler`.
  return (await ler<Pagina<Area>>(`/areas?${consulta}`, token))!;
}

export function buscarArea(token: string, id: number) {
  return ler<Area>(`/areas/${id}`, token);
}

export function criarArea(token: string, dados: DadosArea) {
  return escrever<Area>("POST", "/areas", token, dados);
}

export function atualizarArea(token: string, id: number, dados: DadosArea) {
  return escrever<Area>("PATCH", `/areas/${id}`, token, dados);
}

export function removerArea(token: string, id: number) {
  return escrever<void>("DELETE", `/areas/${id}`, token);
}

/** Áreas para escolher num select (no máximo 100, o limite da API). */
export async function opcoesDeAreas(token: string): Promise<Area[]> {
  const pagina = await ler<Pagina<Area>>("/areas?tamanho=100", token);
  return pagina!.dados;
}
