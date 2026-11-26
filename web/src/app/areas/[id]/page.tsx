import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { excluirArea } from "@/app/areas/acoes";
import BotaoRemover from "@/components/BotaoRemover";
import ListaEnsaios from "@/components/ListaEnsaios";
import BotaoLink from "@/components/ui/Botao";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import Secao from "@/components/ui/Secao";
import { buscarArea } from "@/lib/areas";
import { ensaiosDaArea } from "@/lib/ensaios";
import { idValido } from "@/lib/recusa";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Área | Campo Conectado" };

function Dado({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-suave">{rotulo}</dt>
      <dd className="m-0 font-semibold">{children}</dd>
    </>
  );
}

export default async function DetalheArea({
  params,
}: PageProps<"/areas/[id]">) {
  const token = await exigirEngenheiro();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const area = await buscarArea(token, Number(id));
  if (!area) notFound();
  const ensaios = await ensaiosDaArea(token, area.id);

  return (
    <Pagina>
      <CabecalhoPagina
        titulo={area.nome}
        descricao={area.localizacao}
        voltar={{ href: "/areas", rotulo: "Voltar às áreas" }}
        acoes={
          <BotaoLink href={`/areas/${area.id}/editar`} variante="secundaria">
            Editar área
          </BotaoLink>
        }
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-[1_1_320px] flex-col gap-6">
          <Secao titulo="Dados da área">
            <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2.5">
              <Dado rotulo="Hectares">
                {area.hectares === null
                  ? "-"
                  : `${area.hectares.toLocaleString("pt-BR")} ha`}
              </Dado>
              <Dado rotulo="Tipo de solo">{area.tipoSolo ?? "-"}</Dado>
              <Dado rotulo="Observações">
                <span className="whitespace-pre-line">
                  {area.observacoes ?? "-"}
                </span>
              </Dado>
            </dl>
          </Secao>
          <Secao titulo="Remover área">
            <BotaoRemover
              acao={excluirArea.bind(null, area.id)}
              pergunta={`Remover a área "${area.nome}"?`}
              rotulo="Remover área"
            />
          </Secao>
        </div>
        <Secao
          titulo="Ensaios nesta área"
          className="min-w-0 flex-[999_1_560px]"
        >
          <ListaEnsaios ensaios={ensaios} mostrar="maquina" />
        </Secao>
      </div>
    </Pagina>
  );
}
