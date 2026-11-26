"use client";

import BotaoLink from "@/components/ui/Botao";
import { useActionState } from "react";
import BotaoEnviar from "@/components/BotaoEnviar";
import Campo, { ComUnidade, ESTILO_CONTROLE } from "@/components/Campo";
import CamposAdicionais from "@/components/CamposAdicionais";
import Mensagens from "@/components/Mensagens";
import type {
  CamposMaquina,
  EstadoFormularioMaquina,
} from "@/lib/formulario-maquina";
import type { CampoModelo, FormularioLinha } from "@/lib/maquinas";
import {
  ESTILO_PAINEL,
  ESTILO_TITULO_SECAO,
  LARGURA_TOTAL,
} from "@/components/ui/estilos";
import { ROTULO_TIPO } from "@/lib/rotulos";

type Acao = (
  estado: EstadoFormularioMaquina,
  formData: FormData,
) => Promise<EstadoFormularioMaquina>;

/** Faixa aceita, sem a unidade (ela fica colada ao campo): "De 12 a 50." */
function dica(campo: CampoModelo): string | undefined {
  const n = (v: number) => v.toLocaleString("pt-BR");
  if (campo.minimo !== null && campo.maximo !== null) {
    return `De ${n(campo.minimo)} a ${n(campo.maximo)}.`;
  }
  if (campo.minimo !== null) return `No mínimo ${n(campo.minimo)}.`;
  if (campo.maximo !== null) return `No máximo ${n(campo.maximo)}.`;
  return undefined;
}

/** Controle de um campo da ficha, escolhido pelo tipo definido na linha. */
function ControleDaFicha({
  campo,
  valor,
}: {
  campo: CampoModelo;
  valor: string;
}) {
  const nome = `ficha.${campo.chave}`;
  switch (campo.tipo) {
    case "OPCAO":
      return (
        <select
          key={`${nome}-${valor}`}
          name={nome}
          required={campo.obrigatorio}
          defaultValue={valor}
          className={ESTILO_CONTROLE}
        >
          <option value="">Escolha…</option>
          {campo.opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      );
    case "BOOLEANO":
      return (
        <select
          key={`${nome}-${valor}`}
          name={nome}
          required={campo.obrigatorio}
          defaultValue={valor}
          className={ESTILO_CONTROLE}
        >
          <option value="">
            {campo.obrigatorio ? "Escolha…" : "Não informado"}
          </option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      );
    default: {
      const entrada = (
        <input
          name={nome}
          required={campo.obrigatorio}
          defaultValue={valor}
          inputMode={
            campo.tipo === "NUMERO"
              ? "decimal"
              : campo.tipo === "INTEIRO"
                ? "numeric"
                : undefined
          }
          maxLength={campo.tipo === "TEXTO" ? 200 : undefined}
          className={ESTILO_CONTROLE}
        />
      );
      return campo.unidade ? (
        <ComUnidade unidade={campo.unidade}>{entrada}</ComUnidade>
      ) : (
        entrada
      );
    }
  }
}

export default function FormularioMaquina({
  acao,
  formulario,
  valoresIniciais,
  voltarPara,
}: {
  acao: Acao;
  formulario: FormularioLinha;
  valoresIniciais: CamposMaquina;
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
      className="flex flex-col gap-6"
    >
      <Mensagens mensagens={estado.mensagens} />
      <section
        className={`${ESTILO_PAINEL} grid gap-5 p-5 sm:grid-cols-2 sm:p-6`}
      >
        <h2 className={`${ESTILO_TITULO_SECAO} ${LARGURA_TOTAL}`}>
          Identificação
        </h2>
        <Campo rotulo="Modelo" erro={erros.modelo}>
          <input
            name="modelo"
            required
            maxLength={120}
            defaultValue={valores.modelo}
            className={ESTILO_CONTROLE}
          />
        </Campo>
        <Campo rotulo="Número de série" erro={erros.numeroSerie}>
          <input
            name="numeroSerie"
            required
            maxLength={60}
            defaultValue={valores.numeroSerie}
            className={ESTILO_CONTROLE}
          />
        </Campo>
        <Campo rotulo="Tipo" erro={erros.tipo}>
          <select
            key={`tipo-${valores.tipo}`}
            name="tipo"
            required
            defaultValue={valores.tipo}
            className={ESTILO_CONTROLE}
          >
            <option value="">Escolha…</option>
            {formulario.tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ROTULO_TIPO[tipo]}
              </option>
            ))}
          </select>
        </Campo>
      </section>

      <section
        className={`${ESTILO_PAINEL} grid gap-5 p-5 sm:grid-cols-2 sm:p-6`}
      >
        <h2 className={`${ESTILO_TITULO_SECAO} ${LARGURA_TOTAL}`}>
          Ficha técnica
        </h2>
        {formulario.campos.map((campo) => (
          <Campo
            key={campo.chave}
            rotulo={campo.rotulo}
            opcional={!campo.obrigatorio}
            dica={dica(campo)}
            erro={erros[`ficha.${campo.chave}`]}
          >
            <ControleDaFicha
              campo={campo}
              valor={valores.ficha[campo.chave] ?? ""}
            />
          </Campo>
        ))}
      </section>

      <CamposAdicionais
        iniciais={valoresIniciais.adicionais}
        erro={erros.adicionais}
      />

      <div className="flex items-center gap-3">
        <BotaoEnviar>Salvar máquina</BotaoEnviar>
        <BotaoLink href={voltarPara} variante="fantasma">
          Cancelar
        </BotaoLink>
      </div>
    </form>
  );
}
