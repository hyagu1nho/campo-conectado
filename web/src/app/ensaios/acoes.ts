"use server";

import { redirect } from "next/navigation";
import type { ResultadoEscrita } from "@/lib/api";
import {
  atualizarEnsaio,
  criarEnsaio,
  Ensaio,
  removerEnsaio,
} from "@/lib/ensaios";
import {
  DadosEnsaio,
  EstadoFormularioEnsaio,
  lerFormularioEnsaio,
} from "@/lib/formulario-ensaio";
import { FALHA_DE_COMUNICACAO, traduzirRecusa } from "@/lib/recusa";
import { concluir, devolver } from "@/lib/revisao";
import { exigirEngenheiro } from "@/lib/sessao";

export async function planejarEnsaio(
  _estadoAnterior: EstadoFormularioEnsaio,
  formData: FormData,
): Promise<EstadoFormularioEnsaio> {
  return gravar(formData, (token, dados) => criarEnsaio(token, dados));
}

export async function editarEnsaio(
  id: number,
  _estadoAnterior: EstadoFormularioEnsaio,
  formData: FormData,
): Promise<EstadoFormularioEnsaio> {
  return gravar(formData, (token, dados) => atualizarEnsaio(token, id, dados));
}

async function gravar(
  formData: FormData,
  enviar: (
    token: string,
    dados: DadosEnsaio,
  ) => Promise<ResultadoEscrita<Ensaio>>,
): Promise<EstadoFormularioEnsaio> {
  const token = await exigirEngenheiro();
  const { valores, dados, erros } = lerFormularioEnsaio(formData);
  if (!dados) return { valores, erros, mensagens: [] };

  let resultado: ResultadoEscrita<Ensaio>;
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
  redirect(`/ensaios/${resultado.dados.id}`);
}

/** Ligada a um id com bind. A API só remove ensaio ainda PLANEJADO (409 nos outros). */
export async function excluirEnsaio(
  id: number,
): Promise<{ mensagens: string[] }> {
  const token = await exigirEngenheiro();
  let resultado: ResultadoEscrita<void>;
  try {
    resultado = await removerEnsaio(token, id);
  } catch {
    return { mensagens: [FALHA_DE_COMUNICACAO] };
  }
  if (resultado.situacao === "recusado") {
    return { mensagens: traduzirRecusa(resultado.status, resultado.detalhes) };
  }
  redirect("/ensaios");
}

/** CU-W2: devolver um ensaio ENVIADO com o que o analista precisa corrigir. */
export async function devolverEnsaio(
  id: number,
  _estadoAnterior: { comentario: string; mensagens: string[] },
  formData: FormData,
): Promise<{ comentario: string; mensagens: string[] }> {
  const token = await exigirEngenheiro();
  const comentario = String(formData.get("comentario") ?? "").trim();
  if (!comentario) {
    return {
      comentario,
      mensagens: ["Escreva o que o analista precisa corrigir."],
    };
  }
  if (comentario.length > 1000) {
    return {
      comentario,
      mensagens: ["Use até 1000 caracteres no comentário."],
    };
  }

  let resultado: ResultadoEscrita<Ensaio>;
  try {
    resultado = await devolver(token, id, comentario);
  } catch {
    return { comentario, mensagens: [FALHA_DE_COMUNICACAO] };
  }
  if (resultado.situacao === "recusado") {
    return {
      comentario,
      mensagens: traduzirRecusa(resultado.status, resultado.detalhes),
    };
  }
  redirect(`/ensaios/${id}`);
}

/** CU-W2: concluir. A API confere de novo medições mínimas e avaliação. */
export async function concluirEnsaio(
  id: number,
): Promise<{ mensagens: string[] }> {
  const token = await exigirEngenheiro();
  let resultado: ResultadoEscrita<Ensaio>;
  try {
    resultado = await concluir(token, id);
  } catch {
    return { mensagens: [FALHA_DE_COMUNICACAO] };
  }
  if (resultado.situacao === "recusado") {
    return { mensagens: traduzirRecusa(resultado.status, resultado.detalhes) };
  }
  redirect(`/ensaios/${id}`);
}
