import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editarEnsaio } from "@/app/ensaios/acoes";
import { opcoesDoFormulario } from "@/app/ensaios/opcoes";
import FormularioEnsaio from "@/components/FormularioEnsaio";
import Alerta from "@/components/ui/Alerta";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { buscarEnsaio } from "@/lib/ensaios";
import { camposDoEnsaio } from "@/lib/formulario-ensaio";
import { idValido } from "@/lib/recusa";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar ensaio | Campo Conectado" };

export default async function EditarEnsaio({
  params,
}: PageProps<"/ensaios/[id]/editar">) {
  const token = await exigirEngenheiro();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const ensaio = await buscarEnsaio(token, Number(id));
  if (!ensaio) notFound();

  // A API recusaria de qualquer forma (409); aqui só evita um formulário inútil.
  if (ensaio.situacao !== "PLANEJADO") {
    return (
      <Pagina largura="estreita">
        <CabecalhoPagina
          titulo="Ensaio já iniciado"
          voltar={{ href: `/ensaios/${ensaio.id}`, rotulo: "Voltar ao ensaio" }}
        />
        <Alerta tom="aviso">Só ensaios planejados podem mudar o plano.</Alerta>
      </Pagina>
    );
  }

  const opcoes = await opcoesDoFormulario(token);
  return (
    <Pagina largura="media">
      <CabecalhoPagina
        titulo="Editar plano"
        voltar={{ href: `/ensaios/${ensaio.id}`, rotulo: "Voltar ao ensaio" }}
      />
      <FormularioEnsaio
        acao={editarEnsaio.bind(null, ensaio.id)}
        valoresIniciais={camposDoEnsaio(ensaio)}
        {...opcoes}
        voltarPara={`/ensaios/${ensaio.id}`}
      />
    </Pagina>
  );
}
