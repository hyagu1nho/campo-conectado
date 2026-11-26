import type { Metadata } from "next";
import { planejarEnsaio } from "@/app/ensaios/acoes";
import { opcoesDoFormulario } from "@/app/ensaios/opcoes";
import FormularioEnsaio from "@/components/FormularioEnsaio";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { ENSAIO_VAZIO } from "@/lib/formulario-ensaio";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = {
  title: "Planejar ensaio | Campo Conectado",
};

/** CU-W1: planejar o ensaio já é atribuí-lo a um analista. */
export default async function NovoEnsaio() {
  const token = await exigirEngenheiro();
  const opcoes = await opcoesDoFormulario(token);

  return (
    <Pagina largura="media">
      <CabecalhoPagina
        titulo="Planejar ensaio"
        voltar={{ href: "/ensaios", rotulo: "Voltar aos ensaios" }}
      />
      <FormularioEnsaio
        acao={planejarEnsaio}
        valoresIniciais={ENSAIO_VAZIO}
        {...opcoes}
        voltarPara="/ensaios"
      />
    </Pagina>
  );
}
