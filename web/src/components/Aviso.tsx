/**
 * Página de aviso (403, 404 e 500): código grande, título, uma linha e a
 * ação para sair dali.
 */
export default function Aviso({
  codigo,
  titulo,
  texto,
  acao,
  erro = false,
}: {
  codigo: string;
  titulo: string;
  texto: string;
  acao: React.ReactNode;
  erro?: boolean;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <section
        className={`flex flex-col items-start gap-3 rounded-lg border bg-superficie p-7 ${
          erro ? "border-perigo/40" : "border-borda"
        }`}
      >
        <p
          className={`text-[3.5rem] leading-none font-bold ${
            erro ? "text-perigo/40" : "text-borda"
          }`}
        >
          {codigo}
        </p>
        <h1 className="text-[1.375rem] font-bold">{titulo}</h1>
        <p className="text-sm text-suave">{texto}</p>
        <div className="mt-2">{acao}</div>
      </section>
    </main>
  );
}
