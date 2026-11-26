"use client";

import { useActionState } from "react";
import BotaoEnviar from "@/components/BotaoEnviar";
import Mensagens from "@/components/Mensagens";

type EstadoRemocao = { mensagens: string[] };

/** Remove depois de confirmar; mostra a recusa da API (ex.: 409) se houver. */
export default function BotaoRemover({
  acao,
  pergunta,
  rotulo = "Remover",
}: {
  acao: (estado: EstadoRemocao) => Promise<EstadoRemocao>;
  pergunta: string;
  rotulo?: string;
}) {
  const [estado, acaoDoFormulario] = useActionState(acao, { mensagens: [] });

  return (
    <form
      action={acaoDoFormulario}
      onSubmit={(evento) => {
        if (!window.confirm(pergunta)) evento.preventDefault();
      }}
      className="flex flex-col gap-2.5"
    >
      <Mensagens mensagens={estado.mensagens} />
      <div>
        <BotaoEnviar variante="perigo">{rotulo}</BotaoEnviar>
      </div>
    </form>
  );
}
