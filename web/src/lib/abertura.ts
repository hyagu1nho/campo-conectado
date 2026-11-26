/**
 * A animação de abertura roda uma vez por sessão do navegador (por aba).
 * `sessionStorage` guarda que ela já foi vista; o script abaixo roda no
 * <head>, antes da primeira pintura, e marca o <html> para o CSS esconder a
 * camada sem piscar. Sem acesso ao armazenamento, a animação roda sempre.
 */
export const CHAVE_ABERTURA = "abertura-vista";

export const SCRIPT_ABERTURA = `(function(){try{if(sessionStorage.getItem("${CHAVE_ABERTURA}"))document.documentElement.dataset.abertura="vista"}catch(e){}})()`;
