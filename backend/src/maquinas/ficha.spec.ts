import { Prisma } from '../generated/prisma/client';
import type { CampoModelo } from '../generated/prisma/client';
import { lerValor, tipoPermitido, validarFicha } from './ficha';

function campo(parcial: Partial<CampoModelo>): CampoModelo {
  return {
    id: 1,
    linha: 'PULVERIZACAO',
    chave: 'campo',
    rotulo: 'Campo',
    tipo: 'TEXTO',
    unidade: null,
    obrigatorio: true,
    minimo: null,
    maximo: null,
    opcoes: [],
    ordem: 1,
    ...parcial,
  };
}

const CAMPOS: CampoModelo[] = [
  campo({
    id: 1,
    chave: 'capacidadeTanque',
    rotulo: 'Capacidade do tanque',
    tipo: 'NUMERO',
    minimo: new Prisma.Decimal(600),
    maximo: new Prisma.Decimal(6000),
  }),
  campo({
    id: 2,
    chave: 'numeroBicos',
    rotulo: 'Número de bicos',
    tipo: 'INTEIRO',
    minimo: new Prisma.Decimal(1),
  }),
  campo({
    id: 3,
    chave: 'dosador',
    rotulo: 'Dosador',
    tipo: 'OPCAO',
    opcoes: ['Pneumático', 'Mecânico'],
  }),
  campo({
    id: 4,
    chave: 'taxaVariavel',
    rotulo: 'Taxa variável',
    tipo: 'BOOLEANO',
    obrigatorio: false,
  }),
  campo({ id: 5, chave: 'obs', rotulo: 'Observação', obrigatorio: false }),
];

const FICHA_VALIDA = {
  capacidadeTanque: 3000.5,
  numeroBicos: 72,
  dosador: 'Pneumático',
};

describe('validarFicha', () => {
  it('aceita ficha válida e grava cada valor como texto', () => {
    const { valores, erros } = validarFicha(CAMPOS, FICHA_VALIDA);

    expect(erros).toEqual([]);
    expect(valores).toEqual([
      { campoModeloId: 1, valor: '3000.5' },
      { campoModeloId: 2, valor: '72' },
      { campoModeloId: 3, valor: 'Pneumático' },
    ]);
  });

  it('opcionais vazios ou nulos são ignorados', () => {
    const { valores, erros } = validarFicha(CAMPOS, {
      ...FICHA_VALIDA,
      taxaVariavel: null,
      obs: '',
    });

    expect(erros).toEqual([]);
    expect(valores).toHaveLength(3);
  });

  it('acusa obrigatório ausente', () => {
    const { erros } = validarFicha(CAMPOS, {
      numeroBicos: 1,
      dosador: 'Mecânico',
    });

    expect(erros).toEqual(['Capacidade do tanque é obrigatório']);
  });

  it('acusa campo que não pertence à linha', () => {
    const { erros } = validarFicha(CAMPOS, { ...FICHA_VALIDA, cor: 'azul' });

    expect(erros).toEqual(['cor não é um campo da ficha desta linha']);
  });

  it('confere tipo, faixa e opções, listando todos os erros', () => {
    const { erros } = validarFicha(CAMPOS, {
      capacidadeTanque: 10,
      numeroBicos: 2.5,
      dosador: 'Elétrico',
      taxaVariavel: 'sim',
      obs: 42,
    });

    expect(erros).toEqual([
      'Capacidade do tanque deve estar entre 600 e 6000',
      'Número de bicos deve ser um número inteiro',
      'Dosador deve ser uma destas opções: Pneumático, Mecânico',
      'Taxa variável deve ser verdadeiro ou falso',
      'Observação deve ser um texto',
    ]);
  });

  it('número em texto não é aceito como número', () => {
    const { erros } = validarFicha(CAMPOS, {
      ...FICHA_VALIDA,
      capacidadeTanque: '3000',
    });

    expect(erros).toEqual(['Capacidade do tanque deve ser um número']);
  });

  it('respeita só o mínimo quando não há máximo', () => {
    const { erros } = validarFicha(CAMPOS, { ...FICHA_VALIDA, numeroBicos: 0 });

    expect(erros).toEqual(['Número de bicos deve ser no mínimo 1']);
  });
});

describe('lerValor', () => {
  it('devolve o valor no tipo do campo', () => {
    expect(lerValor('NUMERO', '3000.5')).toBe(3000.5);
    expect(lerValor('INTEIRO', '72')).toBe(72);
    expect(lerValor('BOOLEANO', 'false')).toBe(false);
    expect(lerValor('OPCAO', 'Mecânico')).toBe('Mecânico');
  });
});

describe('tipoPermitido', () => {
  it('segue as combinações de cada linha', () => {
    expect(tipoPermitido('PULVERIZACAO', 'AUTOPROPELIDO')).toBe(true);
    expect(tipoPermitido('PULVERIZACAO', 'ARRASTO')).toBe(false);
    expect(tipoPermitido('DISTRIBUICAO', 'ARRASTO')).toBe(true);
    expect(tipoPermitido('DISTRIBUICAO', 'MONTADA')).toBe(false);
    expect(tipoPermitido('PLANTIO', 'MONTADA')).toBe(true);
    expect(tipoPermitido('PLANTIO', 'AUTOPROPELIDO')).toBe(false);
  });
});
