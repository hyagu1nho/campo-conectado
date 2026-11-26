import Link from "next/link";
import { type Linha, LINHAS, ROTULO_LINHA } from "@/lib/rotulos";

/**
 * Filtro de linha em segmentos. Cada opção é um link (?linha=), então
 * funciona sem JavaScript e fica no histórico. `outros` mantém os demais
 * filtros da página, como a busca.
 */
export default function FiltroLinha({
  base,
  atual,
  outros = {},
}: {
  base: string;
  atual?: Linha;
  outros?: Record<string, string>;
}) {
  const opcoes: { valor?: Linha; rotulo: string }[] = [
    { rotulo: "Todas as linhas" },
    ...LINHAS.map((l) => ({ valor: l, rotulo: ROTULO_LINHA[l] })),
  ];
  const endereco = (valor?: Linha) => {
    const consulta = new URLSearchParams(
      Object.entries(outros).filter(([, v]) => v !== ""),
    );
    if (valor) consulta.set("linha", valor);
    const texto = consulta.toString();
    return texto ? `${base}?${texto}` : base;
  };

  return (
    <nav
      aria-label="Filtrar por linha"
      className="inline-flex w-fit max-w-full overflow-x-auto rounded border border-borda-forte bg-superficie"
    >
      {opcoes.map(({ valor, rotulo }) => {
        const ativo = valor === atual;
        return (
          <Link
            key={rotulo}
            href={endereco(valor)}
            aria-current={ativo ? "page" : undefined}
            className={`border-r border-borda px-3.5 py-2 text-sm whitespace-nowrap last:border-r-0 ${
              ativo
                ? "bg-texto font-semibold text-superficie"
                : "hover:bg-superficie-2"
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
