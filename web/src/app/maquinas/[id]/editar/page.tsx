import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editarMaquina } from "@/app/maquinas/acoes";
import EscolhaDeLinha from "@/components/EscolhaDeLinha";
import FormularioMaquina from "@/components/FormularioMaquina";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import { camposDaMaquina } from "@/lib/formulario-maquina";
import { buscarMaquina, formularioDaLinha } from "@/lib/maquinas";
import { idValido } from "@/lib/recusa";
import { ehLinha } from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar máquina | Campo Conectado" };

/**
 * Editar envia a ficha inteira (a API substitui a anterior). Trocar a linha
 * pela URL (?linha=) começa a ficha nova do zero; a API só aceita a troca se
 * a máquina não tiver ensaios.
 */
export default async function EditarMaquina({
  params,
  searchParams,
}: PageProps<"/maquinas/[id]/editar">) {
  const token = await exigirEngenheiro();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const maquina = await buscarMaquina(token, Number(id));
  if (!maquina) notFound();

  const { linha: linhaPedida } = await searchParams;
  const linha = ehLinha(linhaPedida) ? linhaPedida : maquina.linha;
  const formulario = await formularioDaLinha(token, linha);
  const atuais = camposDaMaquina(maquina);
  const valoresIniciais =
    linha === maquina.linha ? atuais : { ...atuais, tipo: "", ficha: {} };

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo={`Editar ${maquina.modelo}`}
        voltar={{ href: `/maquinas/${maquina.id}`, rotulo: "Voltar à máquina" }}
      />
      <EscolhaDeLinha acao={`/maquinas/${maquina.id}/editar`} linha={linha} />
      <FormularioMaquina
        key={linha}
        acao={editarMaquina.bind(null, maquina.id, linha)}
        formulario={formulario}
        valoresIniciais={valoresIniciais}
        voltarPara={`/maquinas/${maquina.id}`}
      />
    </Pagina>
  );
}
