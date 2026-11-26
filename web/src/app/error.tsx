"use client";

import Aviso from "@/components/Aviso";
import { estiloBotao } from "@/components/ui/estilos";

/** Erro inesperado (API fora do ar, 5xx). O detalhe fica no log do servidor. */
export default function Erro({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Aviso
      codigo="500"
      titulo="Algo deu errado"
      texto={
        error.digest
          ? `O servidor não respondeu. Código ${error.digest}.`
          : "O servidor não respondeu."
      }
      erro
      acao={
        <button type="button" onClick={() => retry()} className={estiloBotao()}>
          Tentar de novo
        </button>
      }
    />
  );
}
