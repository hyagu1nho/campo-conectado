import type { CampoModelo, FormularioLinha, Maquina } from "@/lib/maquinas";
import type { Linha, TipoMaquina } from "@/lib/rotulos";

export const MAXIMO_ADICIONAIS = 20;

export type LinhaAdicional = { nome: string; valor: string; unidade: string };

/** Campos como vêm do formulário: tudo texto. A ficha é indexada pela chave do campo. */
export type CamposMaquina = {
  modelo: string;
  numeroSerie: string;
  tipo: string;
  ficha: Record<string, string>;
  adicionais: LinhaAdicional[];
};

/** O que vai para a API (POST e PATCH). */
export type DadosMaquina = {
  modelo: string;
  numeroSerie: string;
  linha: Linha;
  tipo: TipoMaquina;
  ficha: Record<string, string | number | boolean>;
  camposAdicionais: { nome: string; valor: string; unidade?: string }[];
};

/** Erros por campo: "modelo", "tipo", "ficha.<chave>" e "adicionais". */
export type EstadoFormularioMaquina = {
  valores: CamposMaquina;
  erros: Record<string, string>;
  mensagens: string[];
};

export const MAQUINA_VAZIA: CamposMaquina = {
  modelo: "",
  numeroSerie: "",
  tipo: "",
  ficha: {},
  adicionais: [],
};

const texto = (formData: FormData, campo: string) =>
  String(formData.get(campo) ?? "").trim();

/** Número escrito com vírgula ou ponto decimal. */
const NUMERO = /^-?\d+([.,]\d+)?$/;
const INTEIRO = /^-?\d+$/;

const formatar = (n: number) => n.toLocaleString("pt-BR");

/** Confere um valor da ficha pelo tipo do campo; devolve o valor tipado ou o erro. */
function converter(
  campo: CampoModelo,
  bruto: string,
): { valor: string | number | boolean } | { erro: string } {
  switch (campo.tipo) {
    case "TEXTO":
      return bruto.length > 200
        ? { erro: "Use até 200 caracteres." }
        : { valor: bruto };
    case "OPCAO":
      return campo.opcoes.includes(bruto)
        ? { valor: bruto }
        : { erro: "Escolha uma das opções." };
    case "BOOLEANO":
      if (bruto !== "sim" && bruto !== "nao")
        return { erro: "Escolha sim ou não." };
      return { valor: bruto === "sim" };
    case "NUMERO":
    case "INTEIRO": {
      const padrao = campo.tipo === "NUMERO" ? NUMERO : INTEIRO;
      if (!padrao.test(bruto)) {
        return {
          erro:
            campo.tipo === "NUMERO"
              ? "Use um número."
              : "Use um número inteiro.",
        };
      }
      const n = Number(bruto.replace(",", "."));
      const { minimo, maximo } = campo;
      if ((minimo !== null && n < minimo) || (maximo !== null && n > maximo)) {
        if (minimo !== null && maximo !== null) {
          return {
            erro: `Use um valor entre ${formatar(minimo)} e ${formatar(maximo)}.`,
          };
        }
        return minimo !== null
          ? { erro: `Use no mínimo ${formatar(minimo)}.` }
          : { erro: `Use no máximo ${formatar(maximo!)}.` };
      }
      return { valor: n };
    }
  }
}

/**
 * Lê e confere o formulário contra os campos da linha escolhida. A ação
 * confere de novo mesmo com as restrições do navegador, e a API confere por
 * último (a regra de verdade está lá).
 */
export function lerFormularioMaquina(
  formData: FormData,
  formulario: FormularioLinha,
): {
  valores: CamposMaquina;
  dados: DadosMaquina | null;
  erros: Record<string, string>;
} {
  const erros: Record<string, string> = {};
  const nomes = formData.getAll("adicional.nome").map(String);
  const valoresAd = formData.getAll("adicional.valor").map(String);
  const unidades = formData.getAll("adicional.unidade").map(String);

  const valores: CamposMaquina = {
    modelo: texto(formData, "modelo"),
    numeroSerie: texto(formData, "numeroSerie"),
    tipo: texto(formData, "tipo"),
    ficha: Object.fromEntries(
      formulario.campos.map((c) => [
        c.chave,
        texto(formData, `ficha.${c.chave}`),
      ]),
    ),
    adicionais: nomes
      .map((nome, i) => ({
        nome: nome.trim(),
        valor: (valoresAd[i] ?? "").trim(),
        unidade: (unidades[i] ?? "").trim(),
      }))
      // Linha deixada em branco é ignorada.
      .filter((a) => a.nome || a.valor || a.unidade),
  };

  if (!valores.modelo) erros.modelo = "Informe o modelo.";
  else if (valores.modelo.length > 120)
    erros.modelo = "Use até 120 caracteres.";

  if (!valores.numeroSerie) erros.numeroSerie = "Informe o número de série.";
  else if (valores.numeroSerie.length > 60) {
    erros.numeroSerie = "Use até 60 caracteres.";
  }

  const tipo = formulario.tipos.find((t) => t === valores.tipo);
  if (!tipo) erros.tipo = "Escolha um tipo aceito pela linha.";

  const ficha: DadosMaquina["ficha"] = {};
  for (const campo of formulario.campos) {
    const bruto = valores.ficha[campo.chave];
    if (!bruto) {
      if (campo.obrigatorio)
        erros[`ficha.${campo.chave}`] = "Campo obrigatório.";
      continue;
    }
    const resultado = converter(campo, bruto);
    if ("erro" in resultado) erros[`ficha.${campo.chave}`] = resultado.erro;
    else ficha[campo.chave] = resultado.valor;
  }

  const problemasAdicionais: string[] = [];
  if (valores.adicionais.length > MAXIMO_ADICIONAIS) {
    problemasAdicionais.push(
      `Use no máximo ${MAXIMO_ADICIONAIS} campos adicionais.`,
    );
  }
  if (valores.adicionais.some((a) => !a.nome || !a.valor)) {
    problemasAdicionais.push("Cada campo adicional precisa de nome e valor.");
  }
  if (
    valores.adicionais.some(
      (a) =>
        a.nome.length > 80 || a.valor.length > 200 || a.unidade.length > 20,
    )
  ) {
    problemasAdicionais.push(
      "Nome até 80 caracteres, valor até 200 e unidade até 20.",
    );
  }
  const nomesNormalizados = valores.adicionais.map((a) => a.nome.toLowerCase());
  if (new Set(nomesNormalizados).size !== nomesNormalizados.length) {
    problemasAdicionais.push(
      "Os campos adicionais não podem ter nomes repetidos.",
    );
  }
  if (problemasAdicionais.length > 0) {
    erros.adicionais = problemasAdicionais.join(" ");
  }

  const dados: DadosMaquina | null =
    Object.keys(erros).length > 0 || !tipo
      ? null
      : {
          modelo: valores.modelo,
          numeroSerie: valores.numeroSerie,
          linha: formulario.linha,
          tipo,
          ficha,
          camposAdicionais: valores.adicionais.map(
            ({ nome, valor, unidade }) => ({
              nome,
              valor,
              ...(unidade && { unidade }),
            }),
          ),
        };
  return { valores, dados, erros };
}

/** Preenche o formulário de edição com a máquina atual. */
export function camposDaMaquina(maquina: Maquina): CamposMaquina {
  return {
    modelo: maquina.modelo,
    numeroSerie: maquina.numeroSerie,
    tipo: maquina.tipo,
    ficha: Object.fromEntries(
      maquina.ficha.map(({ chave, valor }) => [
        chave,
        typeof valor === "boolean"
          ? valor
            ? "sim"
            : "nao"
          : typeof valor === "number"
            ? String(valor).replace(".", ",")
            : valor,
      ]),
    ),
    adicionais: maquina.camposAdicionais.map(({ nome, valor, unidade }) => ({
      nome,
      valor,
      unidade: unidade ?? "",
    })),
  };
}
