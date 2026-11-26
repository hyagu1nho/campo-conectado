/** Campos como vêm do formulário: tudo texto (os ids vêm dos selects). */
export type CamposEnsaio = {
  objetivo: string;
  maquinaId: string;
  areaId: string;
  analistaId: string;
  dataPrevista: string;
};

/** O que vai para a API. O engenheiro responsável vem do token, não do formulário. */
export type DadosEnsaio = {
  objetivo: string;
  maquinaId: number;
  areaId: number;
  analistaId: number;
  dataPrevista: string;
};

export type EstadoFormularioEnsaio = {
  valores: CamposEnsaio;
  erros: Partial<Record<keyof CamposEnsaio, string>>;
  mensagens: string[];
};

export const ENSAIO_VAZIO: CamposEnsaio = {
  objetivo: "",
  maquinaId: "",
  areaId: "",
  analistaId: "",
  dataPrevista: "",
};

const texto = (formData: FormData, campo: string) =>
  String(formData.get(campo) ?? "").trim();

const ID = /^[1-9]\d{0,9}$/;

/** Confere se "AAAA-MM-DD" é uma data que existe no calendário. */
function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

export function lerFormularioEnsaio(formData: FormData): {
  valores: CamposEnsaio;
  dados: DadosEnsaio | null;
  erros: EstadoFormularioEnsaio["erros"];
} {
  const valores: CamposEnsaio = {
    objetivo: texto(formData, "objetivo"),
    maquinaId: texto(formData, "maquinaId"),
    areaId: texto(formData, "areaId"),
    analistaId: texto(formData, "analistaId"),
    dataPrevista: texto(formData, "dataPrevista"),
  };
  const erros: EstadoFormularioEnsaio["erros"] = {};

  if (!valores.objetivo) erros.objetivo = "Informe o objetivo do ensaio.";
  else if (valores.objetivo.length > 200) {
    erros.objetivo = "Use até 200 caracteres.";
  }
  if (!ID.test(valores.maquinaId)) erros.maquinaId = "Escolha a máquina.";
  if (!ID.test(valores.areaId)) erros.areaId = "Escolha a área.";
  if (!ID.test(valores.analistaId)) erros.analistaId = "Escolha o analista.";
  if (!dataValida(valores.dataPrevista)) {
    erros.dataPrevista = "Informe uma data válida.";
  }

  const dados =
    Object.keys(erros).length > 0
      ? null
      : {
          objetivo: valores.objetivo,
          maquinaId: Number(valores.maquinaId),
          areaId: Number(valores.areaId),
          analistaId: Number(valores.analistaId),
          dataPrevista: valores.dataPrevista,
        };
  return { valores, dados, erros };
}

/** Preenche o formulário de edição com o ensaio atual. */
export function camposDoEnsaio(ensaio: {
  objetivo: string;
  maquina: { id: number };
  area: { id: number };
  analista: { id: number };
  dataPrevista: string;
}): CamposEnsaio {
  return {
    objetivo: ensaio.objetivo,
    maquinaId: String(ensaio.maquina.id),
    areaId: String(ensaio.area.id),
    analistaId: String(ensaio.analista.id),
    dataPrevista: ensaio.dataPrevista,
  };
}
