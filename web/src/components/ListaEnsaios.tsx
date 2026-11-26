import Link from "next/link";
import SeloSituacao from "@/components/SeloSituacao";
import type { EnsaioResumo } from "@/lib/ensaios";
import { dataBrasileira } from "@/lib/rotulos";

/**
 * Ensaios ligados a uma máquina ou área: situação, objetivo e, abaixo,
 * data e o outro lado da ligação (a área da máquina ou a máquina da área).
 */
export default function ListaEnsaios({
  ensaios,
  mostrar,
}: {
  ensaios: EnsaioResumo[];
  mostrar: "area" | "maquina";
}) {
  if (ensaios.length === 0) {
    return <p className="text-sm text-suave">Nenhum ensaio.</p>;
  }
  return (
    <ul className="flex flex-col [&>li:last-child>a]:border-b-0 [&>li:last-child>a]:pb-0">
      {ensaios.map((ensaio) => (
        <li key={ensaio.id}>
          <Link
            href={`/ensaios/${ensaio.id}`}
            className="flex flex-col items-start gap-1.5 border-b border-borda-fina py-4 first:pt-0 hover:text-primaria"
          >
            <SeloSituacao situacao={ensaio.situacao} />
            <b className="leading-snug font-semibold">{ensaio.objetivo}</b>
            <span className="text-[13px] font-medium text-suave">
              {dataBrasileira(ensaio.dataPrevista)},{" "}
              {mostrar === "area" ? ensaio.area.nome : ensaio.maquina.modelo}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
