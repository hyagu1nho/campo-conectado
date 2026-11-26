"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNavegacao = { href: string; rotulo: string; direita?: boolean };

const BASE =
  "border-b-[3px] px-3 pt-5 pb-[17px] text-[15px] whitespace-nowrap transition-colors";

/** Links principais, com o da seção atual sublinhado em verde. */
export default function Navegacao({
  itens,
  tema,
}: {
  itens: ItemNavegacao[];
  tema: React.ReactNode;
}) {
  const caminho = usePathname();
  const link = ({ href, rotulo }: ItemNavegacao) => {
    const ativo = caminho === href || caminho.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={ativo ? "page" : undefined}
        className={`${BASE} ${
          ativo
            ? "border-marca-ativa font-semibold text-sobre-grafite"
            : "border-transparent font-medium text-sobre-grafite-suave hover:text-sobre-grafite"
        }`}
      >
        {rotulo}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Principal"
      className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
    >
      {itens.filter((i) => !i.direita).map(link)}
      <span className="flex-1" />
      <span className="mx-2">{tema}</span>
      {itens.filter((i) => i.direita).map(link)}
    </nav>
  );
}
