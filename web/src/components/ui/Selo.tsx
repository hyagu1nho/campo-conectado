const TONS = {
  neutro: "bg-neutro-fundo text-neutro-texto",
  info: "bg-info-fundo text-info-texto",
  aviso: "bg-aviso-fundo text-aviso-texto",
  perigo: "bg-perigo-fundo text-perigo-texto",
  sucesso: "bg-sucesso-fundo text-sucesso-texto",
} as const;

export type TomSelo = keyof typeof TONS;

/** Etiqueta curta de situação ou parecer. */
export default function Selo({
  tom = "neutro",
  children,
}: {
  tom?: TomSelo;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONS[tom]}`}
    >
      {children}
    </span>
  );
}
