"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Icones";
import { CHAVE_ABERTURA } from "@/lib/abertura";

/** Tempo total da animação (CSS em globals.css), para tirar a camada do DOM. */
const DURACAO_MS = 3500;

/**
 * Animação de entrada: o símbolo surge no centro, desliza para a esquerda
 * enquanto o nome aparece ao lado, e a camada some revelando o sistema.
 * Roda uma vez por sessão do navegador (por aba): ao montar, guarda no
 * sessionStorage que já foi vista; nas próximas aberturas ou recarregamentos
 * da mesma aba, o script de lib/abertura.ts esconde a camada antes da pintura.
 * Ao navegar entre páginas ela também não volta, porque o layout raiz não é
 * montado de novo. Na primeira vez, vem renderizada do servidor e cobre a
 * tela desde o primeiro quadro.
 * Quem prefere menos movimento (prefers-reduced-motion) não a vê.
 */
export default function Abertura() {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHAVE_ABERTURA, "1");
    } catch {
      // Sem armazenamento: a animação volta a rodar a cada abertura.
    }
    const temporizador = window.setTimeout(() => setVisivel(false), DURACAO_MS);
    return () => window.clearTimeout(temporizador);
  }, []);

  if (!visivel) return null;
  return (
    <div className="abertura" aria-hidden="true">
      <div className="abertura-marca">
        <Logo className="abertura-simbolo" />
        <span className="abertura-nome">Campo Conectado</span>
      </div>
    </div>
  );
}
