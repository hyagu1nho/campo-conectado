import Link from "next/link";

/** Voltar, título da página, linha de dados e ações. */
export default function CabecalhoPagina({
  titulo,
  descricao,
  voltar,
  selo,
  acoes,
}: {
  titulo: string;
  /** Dados do registro (ex.: número de série), nunca texto explicativo. */
  descricao?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
  selo?: React.ReactNode;
  acoes?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {voltar && (
        <Link
          href={voltar.href}
          className="w-fit text-sm font-semibold text-primaria underline-offset-2 hover:underline"
        >
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-2">
          {selo && <div>{selo}</div>}
          <h1 className="text-3xl leading-[1.1] font-bold tracking-[-0.02em] break-words sm:text-[2.5rem]">
            {titulo}
          </h1>
          {descricao && <p className="text-base">{descricao}</p>}
        </div>
        {acoes && (
          <div className="flex flex-wrap items-center gap-2">{acoes}</div>
        )}
      </div>
    </div>
  );
}
