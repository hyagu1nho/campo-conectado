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
      className={`grid gap-x-6 gap-y-4 rounded-lg border border-borda bg-superficie px-5 py-4 sm:grid-cols-2 ${colunas === 3 ? "lg:grid-cols-3" : ""}`}
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
      <dt className="text-[13px] text-suave">{rotulo}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  );
}
