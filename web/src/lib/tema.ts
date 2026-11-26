/**
 * Tema da interface: claro, escuro ou o do sistema. A escolha fica no
 * localStorage; o resultado vai para <html data-theme="light|dark">.
 * Sem acesso ao localStorage (modo privado, por exemplo), vale o sistema.
 */
export type ModoTema = "sistema" | "claro" | "escuro";

export const CHAVE_TEMA = "tema";
export const EVENTO_TEMA = "tema-alterado";

export function lerModo(): ModoTema {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // localStorage indisponível: segue o sistema.
  }
  return "sistema";
}

export function resolverModo(modo: ModoTema): "light" | "dark" {
  if (modo === "claro") return "light";
  if (modo === "escuro") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function aplicarModo(modo: ModoTema) {
  document.documentElement.dataset.theme = resolverModo(modo);
}

export function salvarModo(modo: ModoTema) {
  try {
    if (modo === "sistema") window.localStorage.removeItem(CHAVE_TEMA);
    else window.localStorage.setItem(CHAVE_TEMA, modo);
  } catch {
    // Não foi possível guardar; o tema vale só nesta visita.
  }
  aplicarModo(modo);
  window.dispatchEvent(new Event(EVENTO_TEMA));
}

/**
 * Roda no <head>, antes da primeira pintura, para a página não piscar no
 * tema errado. Mantém a mesma regra de lerModo e resolverModo.
 */
export const SCRIPT_TEMA = `(function(){try{var m=localStorage.getItem("${CHAVE_TEMA}");var d=m==="escuro"||(m!=="claro"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;
