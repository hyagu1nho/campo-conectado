import Link from "next/link";
import { estiloBotao } from "@/components/ui/estilos";

/** Anterior / próxima, com a página guardada na URL. */
export default function Paginacao({
  pagina,
  totalDePaginas,
  endereco,
}: {
  pagina: number;
  totalDePaginas: number;
  endereco: (pagina: number) => string;
}) {
  if (totalDePaginas <= 1) return null;
  const desativado = `${estiloBotao("secundaria", "sm")} pointer-events-none opacity-50`;
  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-4 text-sm"
    >
      {pagina > 1 ? (
        <Link
          href={endereco(pagina - 1)}
          className={estiloBotao("secundaria", "sm")}
        >
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={desativado}>
          Anterior
        </span>
      )}
      <span className="text-suave">
        Página {pagina} de {totalDePaginas}
      </span>
      {pagina < totalDePaginas ? (
        <Link
          href={endereco(pagina + 1)}
          className={estiloBotao("secundaria", "sm")}
        >
          Próxima
        </Link>
      ) : (
        <span aria-disabled="true" className={desativado}>
          Próxima
        </span>
      )}
    </nav>
  );
}
