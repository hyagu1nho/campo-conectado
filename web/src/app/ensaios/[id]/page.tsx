import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  concluirEnsaio,
  devolverEnsaio,
  excluirEnsaio,
} from "@/app/ensaios/acoes";
import BotaoRemover from "@/components/BotaoRemover";
import AcoesRevisao from "@/components/revisao/AcoesRevisao";
import SecaoAvaliacao from "@/components/revisao/SecaoAvaliacao";
import SecaoFalhas from "@/components/revisao/SecaoFalhas";
import SecaoLeituras from "@/components/revisao/SecaoLeituras";
import SecaoMedicoes from "@/components/revisao/SecaoMedicoes";
import Trilha from "@/components/revisao/Trilha";
import BotaoLink from "@/components/ui/Botao";
import CabecalhoPagina from "@/components/ui/CabecalhoPagina";
import { Descricao, Descricoes } from "@/components/ui/Descricoes";
import { ESTILO_LINK } from "@/components/ui/estilos";
import Pagina from "@/components/ui/Pagina";
import Secao from "@/components/ui/Secao";
import { buscarEnsaio } from "@/lib/ensaios";
import { idValido } from "@/lib/recusa";
import {
  buscarAvaliacao,
  buscarPendencias,
  listarFalhas,
  listarMedicoes,
} from "@/lib/revisao";
import {
  dataBrasileira,
  dataHoraBrasileira,
  ROTULO_LINHA,
} from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export const metadata: Metadata = { title: "Ensaio | Campo Conectado" };

export default async function DetalheEnsaio({
  params,
}: PageProps<"/ensaios/[id]">) {
  const token = await exigirEngenheiro();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const ensaio = await buscarEnsaio(token, Number(id));
  if (!ensaio) notFound();
  const planejado = ensaio.situacao === "PLANEJADO";
  const enviado = ensaio.situacao === "ENVIADO";

  // Depois de iniciado, o detalhe vira a revisão (CU-W2): o que o analista
  // registrou e o que a API calculou, tudo buscado em paralelo.
  const revisao = planejado
    ? null
    : await Promise.all([
        listarMedicoes(token, ensaio.id),
        listarFalhas(token, ensaio.id),
        ensaio.maquina.linha === "PULVERIZACAO"
          ? buscarAvaliacao(token, ensaio.id)
          : Promise.resolve(undefined),
        enviado ? buscarPendencias(token, ensaio.id) : Promise.resolve([]),
      ]);
  const avaliacao = revisao?.[2];

  return (
    <Pagina>
      <CabecalhoPagina
        titulo={ensaio.objetivo}
        voltar={{ href: "/ensaios", rotulo: "Voltar aos ensaios" }}
        acoes={
          planejado ? (
            <BotaoLink
              href={`/ensaios/${ensaio.id}/editar`}
              variante="secundaria"
            >
              Editar plano
            </BotaoLink>
          ) : undefined
        }
      />
      <Trilha ensaio={ensaio} />
      <Descricoes>
        <Descricao rotulo="Máquina">
          <Link href={`/maquinas/${ensaio.maquina.id}`} className={ESTILO_LINK}>
            {ensaio.maquina.modelo}
          </Link>
          , {ensaio.maquina.numeroSerie}, {ROTULO_LINHA[ensaio.maquina.linha]}
        </Descricao>
        <Descricao rotulo="Área">
          <Link href={`/areas/${ensaio.area.id}`} className={ESTILO_LINK}>
            {ensaio.area.nome}
          </Link>
        </Descricao>
        <Descricao rotulo="Data prevista">
          {dataBrasileira(ensaio.dataPrevista)}
        </Descricao>
        <Descricao rotulo="Analista">{ensaio.analista.nome}</Descricao>
        <Descricao rotulo="Planejado por">{ensaio.engenheiro.nome}</Descricao>
        <Descricao rotulo="Devoluções">
          {ensaio.devolucoes.length === 0
            ? "Nenhuma"
            : ensaio.devolucoes.length}
        </Descricao>
      </Descricoes>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-6">
          {avaliacao && <SecaoLeituras avaliacao={avaliacao} />}
          {avaliacao && <SecaoAvaliacao avaliacao={avaliacao} />}
          {revisao && <SecaoMedicoes pagina={revisao[0]} />}
          {revisao && <SecaoFalhas pagina={revisao[1]} />}
          {ensaio.devolucoes.length > 0 && (
            <Secao titulo="Devoluções" contagem={ensaio.devolucoes.length}>
              <ul className="flex flex-col gap-3.5">
                {ensaio.devolucoes.map((devolucao) => (
                  <li
                    key={devolucao.id}
                    className="border-l-4 border-perigo pl-3"
                  >
                    <p className="whitespace-pre-line">
                      {devolucao.comentario}
                    </p>
                    <p className="text-sm text-suave">
                      {devolucao.autor.nome},{" "}
                      {dataHoraBrasileira(devolucao.criadoEm)}
                    </p>
                  </li>
                ))}
              </ul>
            </Secao>
          )}
          {planejado && (
            <BotaoRemover
              acao={excluirEnsaio.bind(null, ensaio.id)}
              pergunta="Remover este ensaio planejado?"
              rotulo="Remover ensaio"
            />
          )}
        </div>
        {enviado && revisao && (
          <div className="flex-[1_1_300px]">
            <AcoesRevisao
              devolver={devolverEnsaio.bind(null, ensaio.id)}
              concluir={concluirEnsaio.bind(null, ensaio.id)}
              pendencias={revisao[3]}
            />
          </div>
        )}
      </div>
    </Pagina>
  );
}
