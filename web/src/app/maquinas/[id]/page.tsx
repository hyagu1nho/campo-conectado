import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { excluirMaquina } from "@/app/maquinas/acoes";
import BotaoRemover from "@/components/BotaoRemover";
import ListaEnsaios from "@/components/ListaEnsaios";
import BotaoLink from "@/components/ui/Botao";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import Pagina from "@/components/ui/Pagina";
import Secao from "@/components/ui/Secao";
import { Cabecalho, Linha, Tabela, Td, Th } from "@/components/ui/Tabela";
import { ensaiosDaMaquina } from "@/lib/ensaios";
import {
  buscarMaquina,
  type CampoModelo,
  formularioDaLinha,
  type ItemFicha,
} from "@/lib/maquinas";
import { idValido } from "@/lib/recusa";
import { ROTULO_LINHA, ROTULO_TIPO } from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Máquina | Campo Conectado" };

function exibir({ valor, unidade }: ItemFicha): string {
  const texto =
    typeof valor === "boolean"
      ? valor
        ? "Sim"
        : "Não"
      : typeof valor === "number"
        ? valor.toLocaleString("pt-BR")
        : valor;
  return unidade ? `${texto} ${unidade}` : texto;
}

/** Faixa aceita do campo na linha, ex.: "600 a 6.000 L". */
function faixa(campo?: CampoModelo): string {
  if (!campo || campo.minimo === null || campo.maximo === null) return "-";
  const n = (v: number) => v.toLocaleString("pt-BR");
  const unidade = campo.unidade ? ` ${campo.unidade}` : "";
  return `${n(campo.minimo)} a ${n(campo.maximo)}${unidade}`;
}

export default async function DetalheMaquina({
  params,
}: PageProps<"/maquinas/[id]">) {
  const token = await exigirEngenheiro();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const maquina = await buscarMaquina(token, Number(id));
  if (!maquina) notFound();

  const [formulario, ensaios] = await Promise.all([
    formularioDaLinha(token, maquina.linha),
    ensaiosDaMaquina(token, maquina.id),
  ]);
  const modelos = new Map(formulario.campos.map((c) => [c.chave, c]));

  return (
    <Pagina>
      <CabecalhoPagina
        titulo={maquina.modelo}
        descricao={
          <>
            Número de série{" "}
            <b className="font-semibold">{maquina.numeroSerie}</b>,{" "}
            {ROTULO_LINHA[maquina.linha]},{" "}
            {ROTULO_TIPO[maquina.tipo].toLowerCase()}
          </>
        }
        voltar={{ href: "/maquinas", rotulo: "Voltar às máquinas" }}
        acoes={
          <BotaoLink
            href={`/maquinas/${maquina.id}/editar`}
            variante="secundaria"
          >
            Editar máquina
          </BotaoLink>
        }
      />

      <div className="flex flex-wrap items-start gap-6">
        <Secao titulo="Ficha técnica" className="min-w-0 flex-[999_1_560px]">
          <Tabela semBorda>
            <Cabecalho>
              <Th>Campo</Th>
              <Th direita>Valor</Th>
              <Th direita>Faixa aceita</Th>
            </Cabecalho>
            <tbody>
              {maquina.ficha.map((item) => (
                <Linha key={item.chave}>
                  <Td>{item.rotulo}</Td>
                  <Td direita semQuebra className="font-semibold">
                    {exibir(item)}
                  </Td>
                  <Td direita semQuebra className="text-suave">
                    {faixa(modelos.get(item.chave))}
                  </Td>
                </Linha>
              ))}
            </tbody>
          </Tabela>
          {maquina.camposAdicionais.length > 0 && (
            <>
              <h3 className="mt-2 font-bold">Campos adicionais</h3>
              <Tabela semBorda>
                <tbody>
                  {maquina.camposAdicionais.map((campo) => (
                    <Linha key={campo.id}>
                      <Td>{campo.nome}</Td>
                      <Td direita className="font-semibold">
                        {campo.valor}
                        {campo.unidade ? ` ${campo.unidade}` : ""}
                      </Td>
                    </Linha>
                  ))}
                </tbody>
              </Tabela>
            </>
          )}
        </Secao>

        <div className="flex flex-[1_1_320px] flex-col gap-6">
          <Secao titulo="Ensaios desta máquina">
            <ListaEnsaios ensaios={ensaios} mostrar="area" />
          </Secao>
          <Secao titulo="Remover máquina">
            <BotaoRemover
              acao={excluirMaquina.bind(null, maquina.id)}
              pergunta={`Remover a máquina ${maquina.modelo} (${maquina.numeroSerie})?`}
              rotulo="Remover máquina"
            />
          </Secao>
        </div>
      </div>
    </Pagina>
  );
}
