import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editarArea } from "@/app/areas/acoes";
import FormularioArea from "@/components/FormularioArea";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { buscarArea } from "@/lib/areas";
import { camposDaArea } from "@/lib/formulario-area";
import { idValido } from "@/lib/recusa";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar área | Campo Conectado" };

export default async function EditarArea({
  params,
}: PageProps<"/areas/[id]/editar">) {
  const token = await exigirEngenheiro();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const area = await buscarArea(token, Number(id));
  if (!area) notFound();

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo={`Editar ${area.nome}`}
        voltar={{ href: `/areas/${area.id}`, rotulo: "Voltar à área" }}
      />
      <FormularioArea
        acao={editarArea.bind(null, area.id)}
        valoresIniciais={camposDaArea(area)}
        voltarPara={`/areas/${area.id}`}
      />
    </Pagina>
  );
}
