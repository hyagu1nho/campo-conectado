import type { Metadata } from "next";
import Link from "next/link";
import FiltroLinha from "@/components/FiltroLinha";
import BotaoLink from "@/components/ui/Botao";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { type EnsaioResumo, quadroDeEnsaios } from "@/lib/ensaios";
import {
  dataBrasileira,
  ehLinha,
  ROTULO_SITUACAO,
  type Situacao,
} from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Ensaios | Campo Conectado" };

function ItemEnsaio({ ensaio }: { ensaio: EnsaioResumo }) {
  return (
    <li>
      <Link
        href={`/ensaios/${ensaio.id}`}
        className="flex flex-col gap-0.5 border-b border-borda-fina px-4 py-4 hover:bg-superficie-2"
      >
        <span className="mb-1 text-[15px] leading-snug font-semibold">
          {ensaio.objetivo}
        </span>
        <span className="text-[13px] leading-snug font-semibold text-suave">
          {dataBrasileira(ensaio.dataPrevista)}
        </span>
        <span className="text-[13px] leading-snug text-suave">
          {ensaio.maquina.modelo}, {ensaio.area.nome}
        </span>
        <span className="text-[13px] leading-snug text-suave">
          {ensaio.analista.nome}
        </span>
      </Link>
    </li>
  );
}

function Coluna({
  situacao,
  ensaios,
}: {
  situacao: Situacao;
  ensaios: EnsaioResumo[];
}) {
  // Enviado é a coluna que espera o engenheiro: destaque em amarelo.
  const decisao = situacao === "ENVIADO";
  return (
    <section
      aria-labelledby={`coluna-${situacao}`}
      className={`min-w-0 overflow-hidden rounded-lg bg-superficie ${
        decisao ? "border-2 border-atencao" : "border border-borda"
      }`}
    >
      <h2
        id={`coluna-${situacao}`}
        className={`flex items-baseline justify-between gap-2 border-b border-borda-fina px-4 py-3.5 text-[15px] font-bold ${
          decisao ? "bg-aviso-fundo text-aviso-texto" : ""
        }`}
      >
        {decisao ? "Enviado: sua decisão" : ROTULO_SITUACAO[situacao]}
        <span className={decisao ? "" : "font-medium text-suave"}>
          {ensaios.length}
        </span>
      </h2>
      {ensaios.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-suave">Nenhum ensaio.</p>
      ) : (
        <ul className="[&>li:last-child>a]:border-b-0">
          {ensaios.map((ensaio) => (
            <ItemEnsaio key={ensaio.id} ensaio={ensaio} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function Ensaios({ searchParams }: PageProps<"/ensaios">) {
  const token = await exigirEngenheiro();
  const { linha: linhaPedida } = await searchParams;
  const linha = ehLinha(linhaPedida) ? linhaPedida : undefined;

  const colunas = (await quadroDeEnsaios(token)).map((coluna) => ({
    ...coluna,
    ensaios: linha
      ? coluna.ensaios.filter((e) => e.maquina.linha === linha)
      : coluna.ensaios,
  }));
  const aguardando = colunas.find((c) => c.situacao === "ENVIADO")!.ensaios
    .length;

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Ensaios"
        descricao={
          aguardando > 0 ? (
            <>
              <b className="font-semibold">
                {aguardando} {aguardando === 1 ? "ensaio" : "ensaios"}
              </b>{" "}
              {aguardando === 1 ? "espera" : "esperam"} a sua decisão.
            </>
          ) : undefined
        }
        acoes={<BotaoLink href="/ensaios/novo">Planejar ensaio</BotaoLink>}
      />
      <FiltroLinha base="/ensaios" atual={linha} />
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {colunas.map((coluna) => (
          <Coluna
            key={coluna.situacao}
            situacao={coluna.situacao}
            ensaios={coluna.ensaios}
          />
        ))}
      </div>
    </Pagina>
  );
}
