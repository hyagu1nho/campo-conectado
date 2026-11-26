import type { Metadata } from "next";
import { cadastrarArea } from "@/app/areas/acoes";
import FormularioArea from "@/components/FormularioArea";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { AREA_VAZIA } from "@/lib/formulario-area";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Cadastrar área | Campo Conectado" };

export default async function NovaArea() {
  await exigirEngenheiro();
  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Cadastrar área"
        voltar={{ href: "/areas", rotulo: "Voltar às áreas" }}
      />
      <FormularioArea
        acao={cadastrarArea}
        valoresIniciais={AREA_VAZIA}
        voltarPara="/areas"
      />
    </Pagina>
  );
}
