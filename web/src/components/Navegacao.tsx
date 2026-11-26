"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNavegacao = { href: string; rotulo: string };

const BASE =
  "border-b-[3px] px-3 pt-5 pb-[17px] text-[15px] whitespace-nowrap transition-colors max-sm:pt-3 max-sm:pb-2.5";

/**
 * Links principais, com o da seção atual sublinhado em verde, e o link da
 * conta à direita, separado por um traço. Em telas largas ficam na mesma
 * linha do nome do sistema. Em telas estreitas a conta sobe para a linha do
 * nome e os links principais ocupam a linha de baixo, com rolagem se
 * não couberem.
 */
export default function Navegacao({
  itens,
  conta,
}: {
  itens: ItemNavegacao[];
  conta: ItemNavegacao;
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
    <>
      <nav
        aria-label="Principal"
        className="order-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto sm:flex-1"
      >
        {itens.map(link)}
      </nav>
      <div className="order-2 ml-auto flex shrink-0 items-center sm:order-3">
        <span
          aria-hidden="true"
          className="mr-3 hidden h-6 w-px bg-sobre-grafite-suave/30 sm:block"
        />
        {link(conta)}
      </div>
    </>
  );
}
