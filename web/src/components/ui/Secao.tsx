import { ESTILO_TITULO_SECAO } from "@/components/ui/estilos";

/** Painel com título de segundo nível e um complemento à direita. */
export default function Secao({
  titulo,
  contagem,
  children,
  className = "",
}: {
  titulo: string;
  contagem?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-5 rounded-lg border border-borda bg-superficie px-5 py-5 sm:px-7 sm:py-6 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-borda-fina pb-3.5">
        <h2 className={ESTILO_TITULO_SECAO}>{titulo}</h2>
        {contagem !== undefined && (
          <span className="text-sm text-suave">{contagem}</span>
        )}
      </div>
      {children}
    </section>
  );
}
