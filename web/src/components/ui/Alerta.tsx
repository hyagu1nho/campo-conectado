const TONS = {
  perigo: "border-perigo bg-perigo-fundo text-perigo-texto",
  aviso: "border-atencao bg-aviso-fundo text-aviso-texto",
  sucesso: "border-sucesso-texto bg-sucesso-fundo text-sucesso-texto",
  info: "border-info-texto bg-info-fundo text-info-texto",
} as const;

/** Caixa de aviso. `alerta` anuncia o conteúdo a leitores de tela de imediato. */
export default function Alerta({
  tom = "info",
  alerta = false,
  children,
}: {
  tom?: keyof typeof TONS;
  alerta?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role={alerta ? "alert" : undefined}
      className={`rounded border-l-4 px-4 py-3 text-sm ${TONS[tom]}`}
    >
      {children}
    </div>
  );
}
