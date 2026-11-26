import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

/** Cookie HttpOnly com o JWT. O navegador guarda, mas o JavaScript da página não lê. */
export const COOKIE_SESSAO = "campo_token";

/** Mesma validade do token emitido pela API (1 hora). */
export const DURACAO_SESSAO_SEGUNDOS = 3600;

export type Perfil = "ENGENHEIRO" | "ANALISTA";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

export async function lerToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

/**
 * Quem está logado (id, nome, e-mail e perfil), perguntando à API
 * (GET /auth/perfil). O token não é
 * decodificado aqui: quem confere assinatura e validade é a API.
 * `cache` evita repetir a chamada dentro da mesma requisição.
 */
export const obterUsuario = cache(async (): Promise<Usuario | null> => {
  const token = await lerToken();
  if (!token) return null;

  const resposta = await fetch(`${API_URL}/auth/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (resposta.status === 401) return null;
  if (!resposta.ok) {
    throw new Error(`GET /auth/perfil respondeu ${resposta.status}`);
  }
  return (await resposta.json()) as Usuario;
});

/** Para páginas que só exigem alguém logado. */
export async function exigirUsuario(): Promise<Usuario> {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");
  return usuario;
}

/**
 * O cliente web é do engenheiro. Devolve o token para uso no servidor
 * (chamadas à API); nunca o passe como prop nem o devolva de uma ação.
 */
export async function exigirEngenheiro(): Promise<string> {
  const usuario = await exigirUsuario();
  if (usuario.perfil !== "ENGENHEIRO") redirect("/acesso-negado");
  return (await lerToken())!;
}
