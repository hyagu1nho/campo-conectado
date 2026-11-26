import Link from "next/link";
import { ESTILO_TITULO_SECAO } from "@/components/ui/estilos";
import { type Linha, LINHAS, ROTULO_LINHA } from "@/lib/rotulos";

/** O que a ficha de cada linha descreve, em poucas palavras. */
const RESUMO: Record<Linha, string> = {
  PULVERIZACAO: "Tanque, barras e bicos",
  DISTRIBUICAO: "Reservatório e faixa",
  PLANTIO: "Linhas e espaçamento",
};

/**
 * Escolha da linha por link (?linha=): a página recarrega no servidor com a
 * ficha da linha escolhida. Por isso fica fora do formulário da máquina.
 */
export default function EscolhaDeLinha({
  acao,
  linha,
}: {
  acao: string;
  linha?: Linha;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-borda bg-superficie p-5 sm:p-6">
      <h2 id="titulo-linha" className={ESTILO_TITULO_SECAO}>
        Linha
      </h2>
      <ul aria-labelledby="titulo-linha" className="grid gap-3 sm:grid-cols-3">
        {LINHAS.map((l) => {
          const escolhida = l === linha;
          return (
            <li key={l}>
              <Link
                href={`${acao}?linha=${l}`}
                aria-current={escolhida ? "true" : undefined}
                className={`flex h-full flex-col gap-0.5 rounded-md px-3.5 py-3 ${
                  escolhida
                    ? "border-2 border-primaria"
                    : "m-px border border-borda hover:border-borda-forte"
                }`}
              >
                <b className="font-semibold">{ROTULO_LINHA[l]}</b>
                <span className="text-[13px] text-suave">{RESUMO[l]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
