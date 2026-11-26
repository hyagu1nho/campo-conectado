"use client";

import { useState } from "react";
import { ESTILO_CONTROLE } from "@/components/Campo";
import { estiloBotao } from "@/components/ui/estilos";
import { LinhaAdicional, MAXIMO_ADICIONAIS } from "@/lib/formulario-maquina";

type Linha = LinhaAdicional & { id: number };

/**
 * Linhas de nome, valor e unidade que o engenheiro acrescenta à ficha.
 * Os campos são controlados, então sobrevivem ao reset do formulário após
 * um envio recusado. Os nomes repetidos ("adicional.nome") chegam à ação
 * como listas, na ordem da tela.
 */
export default function CamposAdicionais({
  iniciais,
  erro,
}: {
  iniciais: LinhaAdicional[];
  erro?: string;
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    iniciais.map((linha, id) => ({ ...linha, id })),
  );
  const [proximoId, setProximoId] = useState(iniciais.length);

  const alterar = (id: number, campo: keyof LinhaAdicional, valor: string) =>
    setLinhas((atuais) =>
      atuais.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)),
    );

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-borda bg-superficie p-5 sm:p-6">
      <legend className="float-left mb-1 text-lg font-bold">
        Campos adicionais{" "}
        <span className="text-sm font-normal text-suave">
          (opcional, até {MAXIMO_ADICIONAIS})
        </span>
      </legend>
      {linhas.map((linha) => (
        <div key={linha.id} className="flex flex-wrap items-center gap-2">
          <input
            name="adicional.nome"
            aria-label="Nome do campo adicional"
            placeholder="Nome"
            maxLength={80}
            value={linha.nome}
            onChange={(e) => alterar(linha.id, "nome", e.target.value)}
            className={`${ESTILO_CONTROLE} flex-1`}
          />
          <input
            name="adicional.valor"
            aria-label="Valor do campo adicional"
            placeholder="Valor"
            maxLength={200}
            value={linha.valor}
            onChange={(e) => alterar(linha.id, "valor", e.target.value)}
            className={`${ESTILO_CONTROLE} flex-1`}
          />
          <input
            name="adicional.unidade"
            aria-label="Unidade do campo adicional"
            placeholder="Unidade"
            maxLength={20}
            value={linha.unidade}
            onChange={(e) => alterar(linha.id, "unidade", e.target.value)}
            className={`${ESTILO_CONTROLE} w-28`}
          />
          <button
            type="button"
            onClick={() =>
              setLinhas((atuais) => atuais.filter((l) => l.id !== linha.id))
            }
            className={estiloBotao("secundaria")}
          >
            Remover
          </button>
        </div>
      ))}
      {linhas.length < MAXIMO_ADICIONAIS && (
        <div>
          <button
            type="button"
            onClick={() => {
              setLinhas((atuais) => [
                ...atuais,
                { id: proximoId, nome: "", valor: "", unidade: "" },
              ]);
              setProximoId((id) => id + 1);
            }}
            className={`${estiloBotao("secundaria")} border-primaria text-primaria`}
          >
            Adicionar campo
          </button>
        </div>
      )}
      {erro && <p className="text-[13px] text-perigo">{erro}</p>}
    </fieldset>
  );
}
