import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ESTILO_CONTROLE } from "@/components/Campo";
import FiltroLinha from "@/components/FiltroLinha";
import Paginacao from "@/components/Paginacao";
import BotaoLink from "@/components/ui/Botao";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import EstadoVazio from "@/components/ui/EstadoVazio";
import { estiloBotao, ESTILO_LINK } from "@/components/ui/estilos";
import Pagina from "@/components/ui/Pagina";
import { Cabecalho, Linha, Tabela, Td, Th } from "@/components/ui/Tabela";
import { listarMaquinas } from "@/lib/maquinas";
import { lerPagina } from "@/lib/recusa";
import {
  ehLinha,
  type Linha as TipoLinha,
  ROTULO_LINHA,
  ROTULO_TIPO,
} from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Máquinas | Campo Conectado" };

function enderecoDaPagina(pagina: number, busca: string, linha?: TipoLinha) {
  const consulta = new URLSearchParams({ pagina: String(pagina) });
  if (busca) consulta.set("busca", busca);
  if (linha) consulta.set("linha", linha);
  return `/maquinas?${consulta}`;
}

export default async function Maquinas({
  searchParams,
}: PageProps<"/maquinas">) {
  const token = await exigirEngenheiro();
  const parametros = await searchParams;
  const busca =
    typeof parametros.busca === "string" ? parametros.busca.trim() : "";
  const linha = ehLinha(parametros.linha) ? parametros.linha : undefined;
  const pagina = lerPagina(parametros.pagina);
  if (pagina === null) notFound();

  const resultado = await listarMaquinas(token, { linha, busca, pagina });

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Máquinas"
        acoes={<BotaoLink href="/maquinas/nova">Cadastrar máquina</BotaoLink>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Form
          action="/maquinas"
          className="flex min-w-72 flex-[1_1_280px] gap-2"
        >
          {linha && <input type="hidden" name="linha" value={linha} />}
          <input
            key={`busca-${busca}`}
            name="busca"
            defaultValue={busca}
            placeholder="Modelo ou número de série"
            aria-label="Buscar por modelo ou número de série"
            className={ESTILO_CONTROLE}
          />
          <button type="submit" className={estiloBotao("secundaria")}>
            Buscar
          </button>
        </Form>
        <FiltroLinha base="/maquinas" atual={linha} outros={{ busca }} />
      </div>

      {resultado.total === 0 ? (
        <EstadoVazio
          titulo={
            busca || linha
              ? "Nenhuma máquina com esses filtros."
              : "Nenhuma máquina cadastrada."
          }
          acao={
            busca || linha ? undefined : (
              <BotaoLink href="/maquinas/nova">Cadastrar máquina</BotaoLink>
            )
          }
        />
      ) : pagina > resultado.totalDePaginas ? (
        <EstadoVazio
          titulo="Essa página não existe."
          acao={
            <BotaoLink
              href={enderecoDaPagina(resultado.totalDePaginas, busca, linha)}
              variante="secundaria"
            >
              Ir para a última página
            </BotaoLink>
          }
        />
      ) : (
        <Tabela>
          <Cabecalho>
            <Th>Modelo</Th>
            <Th>Número de série</Th>
            <Th>Linha</Th>
            <Th>Tipo</Th>
          </Cabecalho>
          <tbody>
            {resultado.dados.map((maquina) => (
              <Linha key={maquina.id}>
                <Td>
                  <Link
                    href={`/maquinas/${maquina.id}`}
                    className={ESTILO_LINK}
                  >
                    {maquina.modelo}
                  </Link>
                </Td>
                <Td>{maquina.numeroSerie}</Td>
                <Td>{ROTULO_LINHA[maquina.linha]}</Td>
                <Td>{ROTULO_TIPO[maquina.tipo]}</Td>
              </Linha>
            ))}
          </tbody>
        </Tabela>
      )}

      <Paginacao
        pagina={Math.min(pagina, resultado.totalDePaginas)}
        totalDePaginas={resultado.totalDePaginas}
        endereco={(p) => enderecoDaPagina(p, busca, linha)}
      />
    </Pagina>
  );
}
