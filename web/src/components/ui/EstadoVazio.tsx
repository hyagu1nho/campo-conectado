/** Lista sem resultado, com uma ação opcional. */
export default function EstadoVazio({
  titulo,
  acao,
}: {
  titulo: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-borda bg-superficie px-5 py-6">
      <p className="text-suave">{titulo}</p>
      {acao}
    </div>
  );
}
