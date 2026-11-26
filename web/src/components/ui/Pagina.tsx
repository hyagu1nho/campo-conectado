const LARGURAS = {
  minima: "max-w-md",
  estreita: "max-w-3xl",
  media: "max-w-5xl",
  larga: "max-w-[76rem]",
} as const;

/** Área principal de toda página: largura, margens e espaçamento padrão. */
export default function Pagina({
  largura = "larga",
  centralizar = false,
  ocupado,
  children,
}: {
  largura?: keyof typeof LARGURAS;
  centralizar?: boolean;
  ocupado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main
      aria-busy={ocupado}
      className={`mx-auto flex w-full flex-1 flex-col gap-8 px-4 pt-10 pb-20 sm:px-8 ${LARGURAS[largura]} ${centralizar ? "justify-center" : ""}`}
    >
      {children}
    </main>
  );
}
