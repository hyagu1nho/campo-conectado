"use client";

import { useFormStatus } from "react-dom";
import { estiloBotao, type VarianteBotao } from "@/components/ui/estilos";

/**
 * Botão de envio que se desativa enquanto a ação roda. Precisa ser um
 * componente filho do <form>: no mesmo componente, `pending` fica sempre false.
 */
export default function BotaoEnviar({
  children,
  variante = "primaria",
}: {
  children: React.ReactNode;
  variante?: VarianteBotao;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={estiloBotao(variante)}
    >
      {pending ? "Enviando…" : children}
    </button>
  );
}
