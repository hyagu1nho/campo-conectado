"use server";

import { redirect } from "next/navigation";
import type { ResultadoEscrita } from "@/lib/api";
import { Area, atualizarArea, criarArea, removerArea } from "@/lib/areas";
import { EstadoFormularioArea, lerFormularioArea } from "@/lib/formulario-area";
import { FALHA_DE_COMUNICACAO, traduzirRecusa } from "@/lib/recusa";
import { exigirEngenheiro } from "@/lib/sessao";

export async function cadastrarArea(
  _estadoAnterior: EstadoFormularioArea,
  formData: FormData,
): Promise<EstadoFormularioArea> {
  return gravar(formData, (token, dados) => criarArea(token, dados));
}

export async function editarArea(
  id: number,
  _estadoAnterior: EstadoFormularioArea,
  formData: FormData,
): Promise<EstadoFormularioArea> {
  return gravar(formData, (token, dados) => atualizarArea(token, id, dados));
}

/** Caminho comum de criar e editar: conferir, enviar, traduzir recusa, redirecionar. */
async function gravar(
  formData: FormData,
  enviar: (
    token: string,
    dados: NonNullable<ReturnType<typeof lerFormularioArea>["dados"]>,
  ) => Promise<ResultadoEscrita<Area>>,
): Promise<EstadoFormularioArea> {
  // Fora do try: exigirEngenheiro redireciona lançando uma exceção.
  const token = await exigirEngenheiro();
  const { valores, dados, erros } = lerFormularioArea(formData);
  if (!dados) return { valores, erros, mensagens: [] };

  let resultado: ResultadoEscrita<Area>;
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
  redirect(`/areas/${resultado.dados.id}`);
}

export type EstadoRemocao = { mensagens: string[] };

/** Ligada a um id com bind; o estado anterior que o useActionState passa não é usado. */
export async function excluirArea(id: number): Promise<EstadoRemocao> {
  const token = await exigirEngenheiro();
  let resultado: ResultadoEscrita<void>;
  try {
    resultado = await removerArea(token, id);
  } catch {
    return { mensagens: [FALHA_DE_COMUNICACAO] };
  }
  if (resultado.situacao === "recusado") {
    return { mensagens: traduzirRecusa(resultado.status, resultado.detalhes) };
  }
  redirect("/areas");
}
