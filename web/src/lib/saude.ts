import "server-only";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

/** Situação da API, mostrada no login quando não está ok. */
export type SituacaoApi = "ok" | "banco-indisponivel" | "fora-do-ar";

/**
 * Consulta GET /saude. Não lança: o login avisa quando a API ou o banco
 * estão fora.
 */
export async function consultarSaude(): Promise<SituacaoApi> {
  try {
    const resposta = await fetch(`${API_URL}/saude`, { cache: "no-store" });
    if (resposta.ok) return "ok";
    if (resposta.status === 503) return "banco-indisponivel";
    return "fora-do-ar";
  } catch {
    return "fora-do-ar";
  }
}
