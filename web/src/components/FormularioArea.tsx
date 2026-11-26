"use client";

import { useActionState } from "react";
import BotaoEnviar from "@/components/BotaoEnviar";
import Campo, { ComUnidade, ESTILO_CONTROLE } from "@/components/Campo";
import Mensagens from "@/components/Mensagens";
import BotaoLink from "@/components/ui/Botao";
import {
  ESTILO_FORMULARIO,
  ESTILO_RODAPE_FORMULARIO,
  LARGURA_TOTAL,
} from "@/components/ui/estilos";
import type { CamposArea, EstadoFormularioArea } from "@/lib/formulario-area";

type Acao = (
  estado: EstadoFormularioArea,
  formData: FormData,
) => Promise<EstadoFormularioArea>;

export default function FormularioArea({
  acao,
  valoresIniciais,
  voltarPara,
}: {
  acao: Acao;
  valoresIniciais: CamposArea;
  voltarPara: string;
}) {
  const [estado, acaoDoFormulario] = useActionState(acao, {
    valores: valoresIniciais,
    erros: {},
    mensagens: [],
  });
  // O React limpa o formulário a cada envio; os valores voltam pelo estado.
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
        <Campo rotulo="Nome" erro={erros.nome}>
          <input
            name="nome"
            required
            maxLength={120}
            defaultValue={valores.nome}
            className={ESTILO_CONTROLE}
          />
        </Campo>
      </div>
      <div className={LARGURA_TOTAL}>
        <Campo rotulo="Localização" erro={erros.localizacao}>
          <input
            name="localizacao"
            required
            maxLength={200}
            defaultValue={valores.localizacao}
            className={ESTILO_CONTROLE}
          />
        </Campo>
      </div>
      <Campo rotulo="Hectares" opcional erro={erros.hectares}>
        <ComUnidade unidade="ha">
          <input
            name="hectares"
            inputMode="decimal"
            defaultValue={valores.hectares}
            aria-invalid={erros.hectares ? true : undefined}
            className={ESTILO_CONTROLE}
          />
        </ComUnidade>
      </Campo>
      <Campo rotulo="Tipo de solo" opcional erro={erros.tipoSolo}>
        <input
          name="tipoSolo"
          maxLength={80}
          defaultValue={valores.tipoSolo}
          className={ESTILO_CONTROLE}
        />
      </Campo>
      <div className={LARGURA_TOTAL}>
        <Campo rotulo="Observações" opcional erro={erros.observacoes}>
          <textarea
            name="observacoes"
            rows={3}
            defaultValue={valores.observacoes}
            className={ESTILO_CONTROLE}
          />
        </Campo>
      </div>
      <div className={ESTILO_RODAPE_FORMULARIO}>
        <BotaoEnviar>Salvar área</BotaoEnviar>
        <BotaoLink href={voltarPara} variante="fantasma">
          Cancelar
        </BotaoLink>
      </div>
    </form>
  );
}
