import "server-only";

/**
 * Acesso à API, só no servidor. Toda chamada autenticada leva o token e
 * `cache: "no-store"`: dados de um usuário nunca entram no cache compartilhado.
 */
export const API_URL = process.env.API_URL ?? "http://localhost:3000";

/** Envelope de toda listagem paginada da API. */
export type Pagina<T> = {
  dados: T[];
  pagina: number;
  tamanho: number;
  total: number;
  totalDePaginas: number;
};

/** Resultado de uma escrita: gravou, ou a API recusou com um motivo. */
export type ResultadoEscrita<T> =
  | { situacao: "gravado"; dados: T }
  | { situacao: "recusado"; status: number; detalhes: string[] };

/** Status em que a API explica a recusa no corpo de erro padrão. */
const STATUS_DE_RECUSA = [400, 401, 403, 404, 409];

function cabecalhos(token: string, comCorpo = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(comCorpo && { "Content-Type": "application/json" }),
  };
}

/**
 * GET autenticado. 404 vira `undefined` (a página chama `notFound()`);
 * qualquer outro erro lança e cai no `error.tsx`.
 */
export async function ler<T>(
  caminho: string,
  token: string,
): Promise<T | undefined> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: cabecalhos(token),
    cache: "no-store",
  });
  if (resposta.status === 404) return undefined;
  if (!resposta.ok) {
    throw new Error(`GET ${caminho} respondeu ${resposta.status}`);
  }
  return (await resposta.json()) as T;
}

/**
 * POST, PATCH, PUT ou DELETE autenticado. Recusas conhecidas voltam com os
 * detalhes da API; falha de rede ou 5xx lança.
 */
export async function escrever<T>(
  metodo: "POST" | "PATCH" | "PUT" | "DELETE",
  caminho: string,
  token: string,
  dados?: unknown,
): Promise<ResultadoEscrita<T>> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers: cabecalhos(token, dados !== undefined),
    body: dados === undefined ? undefined : JSON.stringify(dados),
    cache: "no-store",
  });
  if (resposta.ok) {
    const corpo = resposta.status === 204 ? undefined : await resposta.json();
    return { situacao: "gravado", dados: corpo as T };
  }
  if (STATUS_DE_RECUSA.includes(resposta.status)) {
    const corpo = (await resposta.json().catch(() => ({}))) as {
      detalhes?: string[];
    };
    return {
      situacao: "recusado",
      status: resposta.status,
      detalhes: corpo.detalhes ?? [],
    };
  }
  throw new Error(`${metodo} ${caminho} respondeu ${resposta.status}`);
}
