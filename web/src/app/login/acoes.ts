"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EstadoLogin } from "@/lib/formulario-login";
import { COOKIE_SESSAO, DURACAO_SESSAO_SEGUNDOS } from "@/lib/sessao";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

const INDISPONIVEL = "Serviço indisponível. Tente novamente.";

/**
 * Troca e-mail e senha por um token na API e guarda o token em cookie
 * HttpOnly. O analista não recebe sessão no web: o trabalho dele é no app.
 */
export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) {
    return { email, mensagem: "Informe o e-mail e a senha." };
  }

  let token: string;
  try {
    const login = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
      cache: "no-store",
    });
    if (login.status === 401) {
      return { email, mensagem: "E-mail ou senha inválidos." };
    }
    if (login.status === 400) {
      return { email, mensagem: "Confira o formato do e-mail e da senha." };
    }
    if (!login.ok) return { email, mensagem: INDISPONIVEL };
    ({ accessToken: token } = (await login.json()) as { accessToken: string });

    const perfil = await fetch(`${API_URL}/auth/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!perfil.ok) return { email, mensagem: INDISPONIVEL };
    const usuario = (await perfil.json()) as { perfil: string };
    if (usuario.perfil !== "ENGENHEIRO") {
      return {
        email,
        mensagem:
          "O cliente web é do engenheiro. Analistas usam o aplicativo móvel.",
      };
    }
  } catch {
    return { email, mensagem: INDISPONIVEL };
  }

  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  });
  // Fora do try: redirect funciona lançando uma exceção.
  redirect("/");
}

/** Sai por POST (formulário), nunca por um link GET. */
export async function sair(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/login");
}
