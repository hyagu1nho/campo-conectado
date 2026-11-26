import type {
  CampoModelo,
  Linha,
  TipoCampo,
  TipoMaquina,
} from '../generated/prisma/client';

/** Tipos de máquina aceitos em cada linha de atuador. */
const TIPOS_POR_LINHA: Record<Linha, TipoMaquina[]> = {
  DISTRIBUICAO: ['ARRASTO', 'AUTOPROPELIDO'],
  PULVERIZACAO: ['AUTOPROPELIDO'],
  PLANTIO: ['ARRASTO', 'MONTADA'],
};

export function tipoPermitido(linha: Linha, tipo: TipoMaquina): boolean {
  return TIPOS_POR_LINHA[linha].includes(tipo);
}

export function tiposDaLinha(linha: Linha): TipoMaquina[] {
  return TIPOS_POR_LINHA[linha];
}

export const TAMANHO_MAXIMO_VALOR = 200;

export interface ValorValidado {
  campoModeloId: number;
  valor: string;
}

/**
 * Confere a ficha enviada contra os campos pré-prontos da linha.
 * Não para no primeiro erro: devolve todos, para o cliente corrigir de uma vez.
 * Os valores saem como texto, que é como a tabela ValorCampo os guarda.
 */
export function validarFicha(
  campos: CampoModelo[],
  ficha: Record<string, unknown>,
): { valores: ValorValidado[]; erros: string[] } {
  const erros: string[] = [];
  const valores: ValorValidado[] = [];
  const chavesDaLinha = new Set(campos.map((campo) => campo.chave));

  for (const chave of Object.keys(ficha)) {
    if (!chavesDaLinha.has(chave)) {
      erros.push(`${chave} não é um campo da ficha desta linha`);
    }
  }

  for (const campo of campos) {
    const valor = ficha[campo.chave];
    const vazio = valor === undefined || valor === null || valor === '';
    if (vazio) {
      if (campo.obrigatorio) erros.push(`${campo.rotulo} é obrigatório`);
      continue;
    }

    const resultado = conferirValor(campo, valor);
    if ('erro' in resultado) {
      erros.push(`${campo.rotulo} ${resultado.erro}`);
    } else {
      valores.push({ campoModeloId: campo.id, valor: resultado.texto });
    }
  }

  return { valores, erros };
}

type Conferencia = { erro: string } | { texto: string };

/** Confere o valor pelo tipo do campo e devolve o erro ou o texto a gravar. */
function conferirValor(campo: CampoModelo, valor: unknown): Conferencia {
  switch (campo.tipo) {
    case 'TEXTO':
      if (typeof valor !== 'string') return { erro: 'deve ser um texto' };
      if (valor.length > TAMANHO_MAXIMO_VALOR) {
        return {
          erro: `deve ter no máximo ${TAMANHO_MAXIMO_VALOR} caracteres`,
        };
      }
      return { texto: valor };
    case 'NUMERO':
      if (typeof valor !== 'number' || !Number.isFinite(valor)) {
        return { erro: 'deve ser um número' };
      }
      return conferirFaixa(campo, valor);
    case 'INTEIRO':
      if (typeof valor !== 'number' || !Number.isInteger(valor)) {
        return { erro: 'deve ser um número inteiro' };
      }
      return conferirFaixa(campo, valor);
    case 'BOOLEANO':
      return typeof valor === 'boolean'
        ? { texto: String(valor) }
        : { erro: 'deve ser verdadeiro ou falso' };
    case 'OPCAO':
      return typeof valor === 'string' && campo.opcoes.includes(valor)
        ? { texto: valor }
        : { erro: `deve ser uma destas opções: ${campo.opcoes.join(', ')}` };
  }
}

function conferirFaixa(campo: CampoModelo, valor: number): Conferencia {
  const minimo = campo.minimo?.toNumber();
  const maximo = campo.maximo?.toNumber();
  const foraDaFaixa =
    (minimo !== undefined && valor < minimo) ||
    (maximo !== undefined && valor > maximo);
  if (!foraDaFaixa) return { texto: String(valor) };

  if (minimo !== undefined && maximo !== undefined) {
    return { erro: `deve estar entre ${minimo} e ${maximo}` };
  }
  return minimo !== undefined
    ? { erro: `deve ser no mínimo ${minimo}` }
    : { erro: `deve ser no máximo ${maximo}` };
}

/** Converte o texto guardado no banco de volta para o tipo do campo. */
export function lerValor(
  tipo: TipoCampo,
  valor: string,
): string | number | boolean {
  switch (tipo) {
    case 'NUMERO':
    case 'INTEIRO':
      return Number(valor);
    case 'BOOLEANO':
      return valor === 'true';
    default:
      return valor;
  }
}
