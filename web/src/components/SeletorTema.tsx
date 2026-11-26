"use client";

import { useSyncExternalStore } from "react";
import {
  aplicarModo,
  EVENTO_TEMA,
  lerModo,
  salvarModo,
  type ModoTema,
} from "@/lib/tema";

const MODOS: ModoTema[] = ["claro", "sistema", "escuro"];

/** Reage a mudanças feitas aqui, em outra aba ou no tema do sistema. */
function assinar(avisar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  const sincronizar = () => {
    aplicarModo(lerModo());
    avisar();
  };
  window.addEventListener(EVENTO_TEMA, avisar);
  window.addEventListener("storage", sincronizar);
  consulta.addEventListener("change", sincronizar);
  return () => {
    window.removeEventListener(EVENTO_TEMA, avisar);
    window.removeEventListener("storage", sincronizar);
    consulta.removeEventListener("change", sincronizar);
  };
}

/** Modo salvo. No servidor não há localStorage; o valor real entra logo após a hidratação. */
function useModo() {
  return useSyncExternalStore(assinar, lerModo, () => "sistema" as const);
}

const ROTULO_OPCAO: Record<ModoTema, string> = {
  claro: "Claro",
  sistema: "Igual ao sistema",
  escuro: "Escuro",
};

/** Escolha do tema da interface, na página da conta: claro, igual ao sistema ou escuro. */
export function EscolhaTema() {
  const modo = useModo();
  return (
    <fieldset className="flex flex-wrap gap-3">
      <legend className="mb-2.5 text-sm text-suave">Tema da interface</legend>
      {MODOS.map((opcao) => {
        const ativo = modo === opcao;
        return (
          <label
            key={opcao}
            className={`flex flex-1 basis-40 cursor-pointer items-center gap-2.5 rounded-md px-3.5 py-3 ${
              ativo
                ? "border-2 border-primaria"
                : "m-px border border-borda hover:border-borda-forte"
            }`}
          >
            <input
              type="radio"
              name="tema"
              checked={ativo}
              onChange={() => salvarModo(opcao)}
              className="accent-primaria"
            />
            {ROTULO_OPCAO[opcao]}
          </label>
        );
      })}
    </fieldset>
  );
}
