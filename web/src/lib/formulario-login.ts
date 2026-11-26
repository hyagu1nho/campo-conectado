/**
 * Estado do formulário de login. Nunca guarda a senha nem o token: só o
 * e-mail, para o campo não esvaziar depois de um erro, e a mensagem.
 */
export type EstadoLogin = {
  email: string;
  mensagem: string | null;
};

export const LOGIN_VAZIO: EstadoLogin = { email: "", mensagem: null };
