"use client";

import { useActionState } from "react";
import BotaoEnviar from "@/components/BotaoEnviar";
import { ESTILO_CONTROLE } from "@/components/Campo";
import Mensagens from "@/components/Mensagens";
import Alerta from "@/components/ui/Alerta";

type EstadoDevolucao = { comentario: string; mensagens: string[] };
type EstadoConclusao = { mensagens: string[] };

/**
 * Decisão do engenheiro sobre um ensaio ENVIADO: concluir ou devolver com
 * comentário. Concluir não tem volta, por isso pede confirmação.
 */
export default function AcoesRevisao({
  devolver,
  concluir,
  pendencias,
}: {
  devolver: (
    estado: EstadoDevolucao,
    formData: FormData,
  ) => Promise<EstadoDevolucao>;
  concluir: (estado: EstadoConclusao) => Promise<EstadoConclusao>;
  pendencias: string[];
}) {
  const [devolucao, acaoDevolver] = useActionState(devolver, {
    comentario: "",
    mensagens: [],
  });
  const [conclusao, acaoConcluir] = useActionState(concluir, {
    mensagens: [],
  });

  return (
    <aside
      aria-labelledby="titulo-decisao"
      className="flex flex-col gap-4 rounded-lg border-2 border-atencao bg-superficie px-5 py-5 sm:px-6"
    >
      <h2 id="titulo-decisao" className="text-lg font-bold">
        Sua decisão
      </h2>
      <form
        action={acaoConcluir}
        onSubmit={(evento) => {
          if (
            !window.confirm(
              "Concluir o ensaio? Depois disso ele não muda mais.",
            )
          ) {
            evento.preventDefault();
          }
        }}
        className="flex flex-col gap-3 [&>button]:w-full"
      >
        {pendencias.length > 0 ? (
          <Alerta tom="aviso">
            <p className="mb-1 font-semibold">Pendências</p>
            <ul className="list-disc pl-5">
              {pendencias.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Alerta>
        ) : (
          <Alerta tom="sucesso">Medições mínimas e avaliação em ordem.</Alerta>
        )}
        <Mensagens mensagens={conclusao.mensagens} />
        <BotaoEnviar>Concluir ensaio</BotaoEnviar>
      </form>
      <form
        action={acaoDevolver}
        data-aviso-sair
        className="flex flex-col gap-2.5 border-t border-borda-fina pt-4 [&>button]:w-full"
      >
        <Mensagens mensagens={devolucao.mensagens} />
        <label className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold">
            Devolver ao analista
          </span>
          <textarea
            name="comentario"
            required
            maxLength={1000}
            rows={4}
            defaultValue={devolucao.comentario}
            className={ESTILO_CONTROLE}
          />
        </label>
        <BotaoEnviar variante="secundaria">Devolver com comentário</BotaoEnviar>
      </form>
    </aside>
  );
}
