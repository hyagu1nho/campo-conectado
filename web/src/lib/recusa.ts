/** Mensagem para falha de rede ou erro interno da API. */
export const FALHA_DE_COMUNICACAO =
  "Não foi possível falar com a API. Tente novamente.";

/**
 * Transforma a recusa da API em mensagens para o topo do formulário. As
 * mensagens de 400, 404 e 409 já vêm em português da API e são mostradas
 * como estão; 401 e 403 ganham um texto próprio.
 */
export function traduzirRecusa(status: number, detalhes: string[]): string[] {
  if (status === 401) {
    return ["Sua sessão expirou. Entre de novo para continuar."];
  }
  if (status === 403) return ["Esta operação é do perfil engenheiro."];
  if (detalhes.length > 0) return detalhes.map(maiuscula);
  return ["A API recusou a operação."];
}

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Lê o número de página da URL; `null` quando inválido (a página dá 404). */
export function lerPagina(valor: string | string[] | undefined): number | null {
  if (valor === undefined) return 1;
  if (typeof valor !== "string" || !/^[1-9]\d{0,5}$/.test(valor)) return null;
  return Number(valor);
}

/** Confere o id que vem na URL antes de chamar a API. */
export function idValido(id: string): boolean {
  return /^[1-9]\d{0,9}$/.test(id) && Number.isSafeInteger(Number(id));
}
