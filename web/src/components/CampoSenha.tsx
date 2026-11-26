"use client";

import { useState } from "react";
import { ESTILO_CONTROLE } from "@/components/Campo";
import { IconeOlho, IconeOlhoFechado } from "@/components/ui/Icones";

/** Campo de senha com botão para mostrar ou esconder o que foi digitado. */
export default function CampoSenha({
  name,
  autoComplete,
}: {
  name: string;
  autoComplete: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={visivel ? "text" : "password"}
        required
        autoComplete={autoComplete}
        className={`${ESTILO_CONTROLE} w-full pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Esconder a senha" : "Mostrar a senha"}
        aria-pressed={visivel}
        title={visivel ? "Esconder a senha" : "Mostrar a senha"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-suave hover:text-texto"
      >
        {visivel ? <IconeOlhoFechado /> : <IconeOlho />}
      </button>
    </div>
  );
}
