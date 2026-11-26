"use server";

import { redirect } from "next/navigation";
import type { ResultadoEscrita } from "@/lib/api";
import {
  DadosMaquina,
  EstadoFormularioMaquina,
  lerFormularioMaquina,
} from "@/lib/formulario-maquina";
import {
  atualizarMaquina,
  criarMaquina,
  FormularioLinha,
  formularioDaLinha,
  Maquina,
  removerMaquina,
} from "@/lib/maquinas";
import { FALHA_DE_COMUNICACAO, traduzirRecusa } from "@/lib/recusa";
import { ehLinha } from "@/lib/rotulos";
import { exigirEngenheiro } from "@/lib/sessao";

export async function cadastrarMaquina(
  linha: string,
  _estadoAnterior: EstadoFormularioMaquina,
  formData: FormData,
): Promise<EstadoFormularioMaquina> {
  return gravar(linha, formData, (token, dados) => criarMaquina(token, dados));
}

export async function editarMaquina(
  id: number,
  linha: string,
  _estadoAnterior: EstadoFormularioMaquina,
  formData: FormData,
): Promise<EstadoFormularioMaquina> {
  return gravar(linha, formData, (token, dados) =>
    atualizarMaquina(token, id, dados),
  );
}

/**
 * Caminho comum de criar e editar. A linha vem da página (bind), mas é
 * conferida de novo e os campos dela são buscados aqui, no servidor, para
 * converter os valores da ficha ao tipo certo.
 */
async function gravar(
  linha: string,
  formData: FormData,
  enviar: (
    token: string,
    dados: DadosMaquina,
  ) => Promise<ResultadoEscrita<Maquina>>,
): Promise<EstadoFormularioMaquina> {
  const token = await exigirEngenheiro();
  const vazio = {
    modelo: "",
    numeroSerie: "",
    tipo: "",
    ficha: {},
    adicionais: [],
  };
  if (!ehLinha(linha)) {
    return {
      valores: vazio,
      erros: {},
      mensagens: ["Linha de atuação inválida."],
    };
  }

  let formulario: FormularioLinha;
  try {
    formulario = await formularioDaLinha(token, linha);
  } catch {
    return { valores: vazio, erros: {}, mensagens: [FALHA_DE_COMUNICACAO] };
  }
  const { valores, dados, erros } = lerFormularioMaquina(formData, formulario);
  if (!dados) {
    return { valores, erros, mensagens: ["Confira os campos destacados."] };
  }

  let resultado: ResultadoEscrita<Maquina>;
  try {
    resultado = await enviar(token, dados);
  } catch {
    return { valores, erros: {}, mensagens: [FALHA_DE_COMUNICACAO] };
  }
  if (resultado.situacao === "recusado") {
    return {
      valores,
      erros: {},
      mensagens: traduzirRecusa(resultado.status, resultado.detalhes),
    };
  }
  redirect(`/maquinas/${resultado.dados.id}`);
}

/** Ligada a um id com bind; o estado anterior que o useActionState passa não é usado. */
export async function excluirMaquina(
  id: number,
): Promise<{ mensagens: string[] }> {
  const token = await exigirEngenheiro();
  let resultado: ResultadoEscrita<void>;
  try {
    resultado = await removerMaquina(token, id);
  } catch {
    return { mensagens: [FALHA_DE_COMUNICACAO] };
  }
  if (resultado.situacao === "recusado") {
    return { mensagens: traduzirRecusa(resultado.status, resultado.detalhes) };
  }
  redirect("/maquinas");
}
