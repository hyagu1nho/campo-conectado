/** Campos como vêm do formulário: tudo texto. */
export type CamposArea = {
  nome: string;
  localizacao: string;
  hectares: string;
  tipoSolo: string;
  observacoes: string;
};

/** O que vai para a API. Opcional vazio vira null, para apagar na edição. */
export type DadosArea = {
  nome: string;
  localizacao: string;
  hectares: number | null;
  tipoSolo: string | null;
  observacoes: string | null;
};

export type EstadoFormularioArea = {
  valores: CamposArea;
  erros: Partial<Record<keyof CamposArea, string>>;
  mensagens: string[];
};

export const AREA_VAZIA: CamposArea = {
  nome: "",
  localizacao: "",
  hectares: "",
  tipoSolo: "",
  observacoes: "",
};

const texto = (formData: FormData, campo: string) =>
  String(formData.get(campo) ?? "").trim();

/**
 * Lê e confere o formulário. A ação confere de novo mesmo com `required` no
 * navegador, porque ela pode ser chamada sem passar pela página; e a API
 * confere por último.
 */
export function lerFormularioArea(formData: FormData): {
  valores: CamposArea;
  dados: DadosArea | null;
  erros: EstadoFormularioArea["erros"];
} {
  const valores: CamposArea = {
    nome: texto(formData, "nome"),
    localizacao: texto(formData, "localizacao"),
    hectares: texto(formData, "hectares"),
    tipoSolo: texto(formData, "tipoSolo"),
    observacoes: texto(formData, "observacoes"),
  };
  const erros: EstadoFormularioArea["erros"] = {};

  if (!valores.nome) erros.nome = "Informe o nome.";
  else if (valores.nome.length > 120) erros.nome = "Use até 120 caracteres.";

  if (!valores.localizacao) erros.localizacao = "Informe a localização.";
  else if (valores.localizacao.length > 200) {
    erros.localizacao = "Use até 200 caracteres.";
  }

  let hectares: number | null = null;
  if (valores.hectares) {
    // Aceita vírgula decimal, como se escreve em português.
    const normalizado = valores.hectares.replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(normalizado) || Number(normalizado) <= 0) {
      erros.hectares =
        "Use um número maior que zero, com até 2 casas decimais.";
    } else {
      hectares = Number(normalizado);
    }
  }

  if (valores.tipoSolo.length > 80) erros.tipoSolo = "Use até 80 caracteres.";

  const dados =
    Object.keys(erros).length > 0
      ? null
      : {
          nome: valores.nome,
          localizacao: valores.localizacao,
          hectares,
          tipoSolo: valores.tipoSolo || null,
          observacoes: valores.observacoes || null,
        };
  return { valores, dados, erros };
}

/** Preenche o formulário de edição com a área atual. */
export function camposDaArea(area: DadosArea): CamposArea {
  return {
    nome: area.nome,
    localizacao: area.localizacao,
    hectares:
      area.hectares === null ? "" : String(area.hectares).replace(".", ","),
    tipoSolo: area.tipoSolo ?? "",
    observacoes: area.observacoes ?? "",
  };
}
