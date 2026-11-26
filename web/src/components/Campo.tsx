/** Rótulo, controle, faixa aceita e erro de um campo de formulário. */
export default function Campo({
  rotulo,
  erro,
  dica,
  opcional = false,
  children,
}: {
  rotulo: string;
  erro?: string;
  /** Só dados curtos, como a faixa aceita ("De 12 a 50."). */
  dica?: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-semibold">
        {rotulo}
        {opcional && (
          <span className="font-normal text-suave"> (opcional)</span>
        )}
      </span>
      {children}
      {dica && !erro && <span className="text-[13px] text-suave">{dica}</span>}
      {erro && <span className="text-[13px] text-perigo">{erro}</span>}
    </label>
  );
}

/** Classe comum dos controles de formulário (input, select e textarea). */
export const ESTILO_CONTROLE =
  "block min-h-10 w-full min-w-0 rounded border border-borda-forte bg-superficie px-3 py-2 text-[15px] text-texto transition-colors placeholder:text-suave/70 hover:border-suave focus-visible:border-primaria focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-primaria disabled:opacity-60 aria-invalid:border-perigo aria-invalid:outline-1 aria-invalid:outline-perigo";

/** Campo com unidade colada à direita (L, m, °C, ha). */
export function ComUnidade({
  unidade,
  children,
}: {
  unidade: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex [&>input]:rounded-r-none">
      {children}
      <span className="flex min-h-10 items-center rounded-r border border-l-0 border-borda-forte bg-fundo px-3 text-sm text-suave">
        {unidade}
      </span>
    </span>
  );
}
