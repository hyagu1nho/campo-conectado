"use client";

import { useEffect } from "react";

const PERGUNTA =
  "Há dados digitados que ainda não foram salvos. Sair mesmo assim e perder o que foi digitado?";

/** Formulário com aviso que já recebeu digitação (marcado com data-sujo). */
function formularioAlterado(): HTMLFormElement | null {
  return document.querySelector("form[data-aviso-sair][data-sujo]");
}

function confirmarSaida(evento: Event): void {
  if (window.confirm(PERGUNTA)) {
    // Confirmou: não perguntar de novo no beforeunload desta mesma saída.
    formularioAlterado()?.removeAttribute("data-sujo");
    return;
  }
  evento.preventDefault();
  evento.stopPropagation();
}

/**
 * Evita perder o que foi digitado por um clique sem querer. Vale para os
 * formulários marcados com `data-aviso-sair`. Depois da primeira digitação,
 * pede confirmação ao clicar num link, ao enviar outro formulário (trocar a
 * linha, sair da conta) e ao fechar ou recarregar a aba. Enviar o próprio
 * formulário não pergunta: se a gravação der certo, a página muda; se a API
 * recusar, os dados continuam na tela e o aviso continua valendo.
 *
 * Os ouvintes ficam no documento, na fase de captura, para rodar antes do
 * Link e do Form do Next.js e poder cancelar a navegação.
 */
export default function GuardaAlteracoes() {
  useEffect(() => {
    const aoDigitar = (evento: Event) => {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      alvo.closest("form[data-aviso-sair]")?.setAttribute("data-sujo", "");
    };

    const aoClicar = (evento: MouseEvent) => {
      if (evento.defaultPrevented || evento.button !== 0) return;
      // Ctrl, Shift e afins abrem em outra aba: a página atual não se perde.
      if (
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      const link = alvo.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (
        (link.target && link.target !== "_self") ||
        link.hasAttribute("download")
      ) {
        return;
      }
      if (formularioAlterado()) confirmarSaida(evento);
    };

    const aoEnviar = (evento: SubmitEvent) => {
      const alterado = formularioAlterado();
      if (!alterado || alterado === evento.target) return;
      confirmarSaida(evento);
    };

    const antesDeSair = (evento: BeforeUnloadEvent) => {
      if (!formularioAlterado()) return;
      // O navegador mostra a própria mensagem; o texto não é personalizável.
      evento.preventDefault();
      evento.returnValue = "";
    };

    document.addEventListener("input", aoDigitar, true);
    document.addEventListener("change", aoDigitar, true);
    document.addEventListener("click", aoClicar, true);
    document.addEventListener("submit", aoEnviar, true);
    window.addEventListener("beforeunload", antesDeSair);
    return () => {
      document.removeEventListener("input", aoDigitar, true);
      document.removeEventListener("change", aoDigitar, true);
      document.removeEventListener("click", aoClicar, true);
      document.removeEventListener("submit", aoEnviar, true);
      window.removeEventListener("beforeunload", antesDeSair);
    };
  }, []);

  return null;
}
