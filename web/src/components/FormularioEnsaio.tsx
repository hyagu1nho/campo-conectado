"use client";

import BotaoLink from "@/components/ui/Botao";
import { useActionState } from "react";
import BotaoEnviar from "@/components/BotaoEnviar";
import Campo, { ESTILO_CONTROLE } from "@/components/Campo";
import Mensagens from "@/components/Mensagens";
import {
  ESTILO_FORMULARIO,
  ESTILO_RODAPE_FORMULARIO,
  LARGURA_TOTAL,
} from "@/components/ui/estilos";
import type {
  CamposEnsaio,
  EstadoFormularioEnsaio,
} from "@/lib/formulario-ensaio";

type Acao = (
  estado: EstadoFormularioEnsaio,
  formData: FormData,
) => Promise<EstadoFormularioEnsaio>;

export type Opcao = { id: number; rotulo: string };

/** Select de ids; `key` reaplica o valor depois do reset do formulário. */
function Escolha({
  nome,
  valor,
  opcoes,
  vazio,
}: {
  nome: keyof CamposEnsaio;
  valor: string;
  opcoes: Opcao[];
  vazio: string;
}) {
  return (
    <select
      key={`${nome}-${valor}`}
      name={nome}
      required
      defaultValue={valor}
      className={ESTILO_CONTROLE}
    >
      <option value="">{opcoes.length === 0 ? vazio : "Escolha…"}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.id} value={opcao.id}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );
}

export default function FormularioEnsaio({
  acao,
  valoresIniciais,
  maquinas,
  areas,
  analistas,
  voltarPara,
}: {
  acao: Acao;
  valoresIniciais: CamposEnsaio;
  maquinas: Opcao[];
  areas: Opcao[];
  analistas: Opcao[];
  voltarPara: string;
}) {
  const [estado, acaoDoFormulario] = useActionState(acao, {
    valores: valoresIniciais,
    erros: {},
    mensagens: [],
  });
  const { valores, erros } = estado;

  return (
    <form
      action={acaoDoFormulario}
      data-aviso-sair
      className={ESTILO_FORMULARIO}
    >
      {estado.mensagens.length > 0 && (
        <div className={LARGURA_TOTAL}>
          <Mensagens mensagens={estado.mensagens} />
        </div>
      )}
      <div className={LARGURA_TOTAL}>
        <Campo rotulo="Objetivo" erro={erros.objetivo}>
          <textarea
            name="objetivo"
            required
            maxLength={200}
            rows={2}
            defaultValue={valores.objetivo}
            className={ESTILO_CONTROLE}
          />
        </Campo>
      </div>
      <div className={LARGURA_TOTAL}>
        <Campo rotulo="Máquina" erro={erros.maquinaId}>
          <Escolha
            nome="maquinaId"
            valor={valores.maquinaId}
            opcoes={maquinas}
            vazio="Nenhuma máquina cadastrada"
          />
        </Campo>
      </div>
      <Campo rotulo="Área" erro={erros.areaId}>
        <Escolha
          nome="areaId"
          valor={valores.areaId}
          opcoes={areas}
          vazio="Nenhuma área cadastrada"
        />
      </Campo>
      <Campo rotulo="Data prevista" erro={erros.dataPrevista}>
        <input
          type="date"
          name="dataPrevista"
          required
          defaultValue={valores.dataPrevista}
          className={ESTILO_CONTROLE}
        />
      </Campo>
      <div className={LARGURA_TOTAL}>
        <Campo rotulo="Analista responsável" erro={erros.analistaId}>
          <Escolha
            nome="analistaId"
            valor={valores.analistaId}
            opcoes={analistas}
            vazio="Nenhum analista cadastrado"
          />
        </Campo>
      </div>
      <div className={ESTILO_RODAPE_FORMULARIO}>
        <BotaoEnviar>Salvar plano</BotaoEnviar>
        <BotaoLink href={voltarPara} variante="fantasma">
          Cancelar
        </BotaoLink>
      </div>
    </form>
  );
}
