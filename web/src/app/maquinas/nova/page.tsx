import type { Metadata } from "next";
import { cadastrarMaquina } from "@/app/maquinas/acoes";
import EscolhaDeLinha from "@/components/EscolhaDeLinha";
import FormularioMaquina from "@/components/FormularioMaquina";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { MAQUINA_VAZIA } from "@/lib/formulario-maquina";
import { formularioDaLinha } from "@/lib/maquinas";
import { ehLinha } from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = {
  title: "Cadastrar máquina | Campo Conectado",
};

/** Primeiro a linha (pela URL), depois o formulário com a ficha dessa linha. */
export default async function NovaMaquina({
  searchParams,
}: PageProps<"/maquinas/nova">) {
  const token = await exigirEngenheiro();
  const { linha } = await searchParams;
  const formulario = ehLinha(linha)
    ? await formularioDaLinha(token, linha)
    : null;

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Cadastrar máquina"
        voltar={{ href: "/maquinas", rotulo: "Voltar às máquinas" }}
      />
      <EscolhaDeLinha acao="/maquinas/nova" linha={formulario?.linha} />
      {formulario && (
        <FormularioMaquina
          key={formulario.linha}
          acao={cadastrarMaquina.bind(null, formulario.linha)}
          formulario={formulario}
          valoresIniciais={MAQUINA_VAZIA}
          voltarPara="/maquinas"
        />
      )}
    </Pagina>
  );
}
