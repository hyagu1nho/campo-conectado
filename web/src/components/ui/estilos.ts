/** Classes compartilhadas pelos componentes de interface. */

export type VarianteBotao = "primaria" | "secundaria" | "fantasma" | "perigo";
export type TamanhoBotao = "md" | "sm";

// Raio de 4 px nos controles, sem sombra; o texto do botão diz a ação.
const BASE_BOTAO =
  "inline-flex items-center justify-center gap-2 rounded border font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-60";

const VARIANTES: Record<VarianteBotao, string> = {
  primaria:
    "border-transparent bg-primaria text-sobre-primaria hover:bg-primaria-hover",
  secundaria:
    "border-borda-forte bg-superficie text-texto hover:bg-superficie-2",
  fantasma: "border-transparent text-texto hover:bg-superficie-2",
  perigo: "border-perigo/50 bg-superficie text-perigo hover:bg-perigo-fundo",
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  md: "min-h-10 px-4 text-sm",
  sm: "min-h-8 px-3 text-[13px]",
};

export function estiloBotao(
  variante: VarianteBotao = "primaria",
  tamanho: TamanhoBotao = "md",
): string {
  return `${BASE_BOTAO} ${VARIANTES[variante]} ${TAMANHOS[tamanho]}`;
}

/** Link de texto dentro de tabelas e parágrafos. */
export const ESTILO_LINK =
  "font-semibold text-primaria underline-offset-2 hover:underline";

/** Cabeçalho e célula de tabela: caixa normal, linhas finas. */
export const ESTILO_TH =
  "border-b border-borda px-4 py-3 text-[13px] font-semibold text-suave";
export const ESTILO_TD = "border-b border-borda-fina px-4 py-3.5 align-top";

/** Painel: papel sobre o aço, borda de 1 px e raio de 8 px. */
export const ESTILO_PAINEL = "rounded-lg border border-borda bg-superficie";

/** Formulário em painel, duas colunas a partir de telas médias. */
export const ESTILO_FORMULARIO =
  "grid gap-5 rounded-lg border border-borda bg-superficie p-5 sm:grid-cols-2 sm:p-6";

/** Linha dos botões no fim do formulário. */
export const ESTILO_RODAPE_FORMULARIO =
  "flex items-center gap-3 border-t border-borda-fina pt-5 sm:col-span-2";

/** Ocupa as duas colunas do formulário. */
export const LARGURA_TOTAL = "sm:col-span-2";

/** Título de seção dentro de um painel. */
export const ESTILO_TITULO_SECAO = "text-lg font-bold leading-tight";
