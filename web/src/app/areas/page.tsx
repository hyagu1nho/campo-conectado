import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ESTILO_CONTROLE } from "@/components/Campo";
import Paginacao from "@/components/Paginacao";
import BotaoLink from "@/components/ui/Botao";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import EstadoVazio from "@/components/ui/EstadoVazio";
import { estiloBotao, ESTILO_LINK } from "@/components/ui/estilos";
import Pagina from "@/components/ui/Pagina";
import { Cabecalho, Linha, Tabela, Td, Th } from "@/components/ui/Tabela";
import { listarAreas } from "@/lib/areas";
import { lerPagina } from "@/lib/recusa";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Áreas | Campo Conectado" };

function enderecoDaPagina(pagina: number, nome: string) {
  const consulta = new URLSearchParams({ pagina: String(pagina) });
  if (nome) consulta.set("nome", nome);
  return `/areas?${consulta}`;
}

export default async function Areas({ searchParams }: PageProps<"/areas">) {
  const token = await exigirEngenheiro();
  const parametros = await searchParams;
  const nome =
    typeof parametros.nome === "string" ? parametros.nome.trim() : "";
  const pagina = lerPagina(parametros.pagina);
  if (pagina === null) notFound();

  const resultado = await listarAreas(token, { nome, pagina });

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Áreas"
        acoes={<BotaoLink href="/areas/nova">Cadastrar área</BotaoLink>}
      />

      <Form action="/areas" className="flex max-w-xl gap-2">
        <input
          key={nome}
          name="nome"
          defaultValue={nome}
          placeholder="Nome da área"
          aria-label="Buscar pelo nome"
          className={ESTILO_CONTROLE}
        />
        <button type="submit" className={estiloBotao("secundaria")}>
          Buscar
        </button>
      </Form>

      {resultado.total === 0 ? (
        <EstadoVazio
          titulo={
            nome ? "Nenhuma área com esse nome." : "Nenhuma área cadastrada."
          }
          acao={
            nome ? undefined : (
              <BotaoLink href="/areas/nova">Cadastrar área</BotaoLink>
            )
          }
        />
      ) : pagina > resultado.totalDePaginas ? (
        <EstadoVazio
          titulo="Essa página não existe."
          acao={
            <BotaoLink
              href={enderecoDaPagina(resultado.totalDePaginas, nome)}
              variante="secundaria"
            >
              Ir para a última página
            </BotaoLink>
          }
        />
      ) : (
        <Tabela>
          <Cabecalho>
            <Th>Nome</Th>
            <Th>Localização</Th>
            <Th direita>Hectares</Th>
            <Th>Tipo de solo</Th>
          </Cabecalho>
          <tbody>
            {resultado.dados.map((area) => (
              <Linha key={area.id}>
                <Td>
                  <Link href={`/areas/${area.id}`} className={ESTILO_LINK}>
                    {area.nome}
                  </Link>
                </Td>
                <Td>{area.localizacao}</Td>
                <Td direita>{area.hectares?.toLocaleString("pt-BR") ?? "-"}</Td>
                <Td>{area.tipoSolo ?? "-"}</Td>
              </Linha>
            ))}
          </tbody>
        </Tabela>
      )}

      <Paginacao
        pagina={Math.min(pagina, resultado.totalDePaginas)}
        totalDePaginas={resultado.totalDePaginas}
        endereco={(p) => enderecoDaPagina(p, nome)}
      />
    </Pagina>
  );
}
