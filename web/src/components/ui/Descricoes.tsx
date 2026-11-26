/** Pares rótulo e valor em grade, dentro de um painel. Use com <Descricao>. */
export function Descricoes({
  children,
  colunas = 3,
}: {
  children: React.ReactNode;
  colunas?: 2 | 3;
}) {
  return (
    <dl
      className={`grid gap-x-8 gap-y-5 rounded-lg border border-borda bg-superficie px-5 py-5 sm:grid-cols-2 sm:px-7 sm:py-6 ${colunas === 3 ? "lg:grid-cols-3" : ""}`}
    >
      {children}
    </dl>
  );
}

export function Descricao({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-[13px] font-medium text-suave">{rotulo}</dt>
      <dd className="leading-snug font-semibold break-words">{children}</dd>
    </div>
  );
}
