import { Criterio } from '../generated/prisma/client';
import {
  calcularEvidencias,
  conferirEnvio,
  DadosAvaliacao,
  exigeJustificativa,
} from './regras';

/** Avaliação completa e coerente, sem falha crítica. */
function avaliacaoCompleta(): DadosAvaliacao {
  return {
    velocidade: 18,
    terreno: 'Ondulado',
    horimetroInicial: 100,
    horimetroFinal: 108.5,
    capacidadeOperacional: 32,
    capacidadeConcorrente: 30,
    parecerFinal: 'APROVADA',
    justificativaFinal: null,
    criterios: Object.values(Criterio).map((criterio) => ({
      criterio,
      parecer: 'CONFORME' as const,
      justificativa: null,
    })),
  };
}

describe('exigeJustificativa', () => {
  it.each([
    ['CONFORME', false],
    ['CONFORME_COM_RESSALVA', true],
    ['NAO_CONFORME', true],
    ['APROVADA', false],
    ['APROVADA_COM_RESSALVA', true],
    ['REPROVADA', true],
  ] as const)('%s -> %s', (parecer, esperado) => {
    expect(exigeJustificativa(parecer)).toBe(esperado);
  });
});

describe('conferirEnvio', () => {
  it('avaliação completa e coerente não tem pendências', () => {
    expect(conferirEnvio(avaliacaoCompleta(), false)).toEqual([]);
  });

  it('sem avaliação, uma pendência só', () => {
    expect(conferirEnvio(null, false)).toEqual([
      'A avaliação da Pulverização não foi preenchida',
    ]);
  });

  it('aponta campos, critérios e parecer final que faltam', () => {
    const avaliacao = {
      ...avaliacaoCompleta(),
      velocidade: null,
      parecerFinal: null,
      criterios: avaliacaoCompleta().criterios.filter(
        (c) => c.criterio !== 'MANUTENCAO',
      ),
    };
    expect(conferirEnvio(avaliacao, false)).toEqual([
      'Falta preencher: Velocidade',
      'Falta o parecer de: Manutenção',
      'Falta preencher: Parecer final',
    ]);
  });

  it('horímetro final menor que o inicial', () => {
    const avaliacao = { ...avaliacaoCompleta(), horimetroFinal: 90 };
    expect(conferirEnvio(avaliacao, false)).toEqual([
      'O horímetro final deve ser maior ou igual ao inicial',
    ]);
  });

  it('justificativa obrigatória em critério e no parecer final', () => {
    const avaliacao = avaliacaoCompleta();
    avaliacao.criterios[0] = {
      criterio: 'ESTABILIDADE_BARRAS',
      parecer: 'CONFORME_COM_RESSALVA',
      justificativa: '   ',
    };
    avaliacao.parecerFinal = 'APROVADA_COM_RESSALVA';
    expect(conferirEnvio(avaliacao, false)).toEqual([
      'Estabilidade das barras: justificativa obrigatória quando o parecer não é CONFORME',
      'Parecer final: justificativa obrigatória quando não é APROVADA',
    ]);
  });

  it('com falha crítica, durabilidade não pode ser conforme nem a máquina aprovada', () => {
    expect(conferirEnvio(avaliacaoCompleta(), true)).toEqual([
      'Com falha crítica registrada, a durabilidade das peças não pode ser CONFORME',
      'Com falha crítica ou critério NAO_CONFORME, o parecer final não pode ser APROVADA',
    ]);
  });

  it('critério não conforme impede aprovar', () => {
    const avaliacao = avaliacaoCompleta();
    avaliacao.criterios[1] = {
      criterio: 'TEMPERATURA_MOTOR',
      parecer: 'NAO_CONFORME',
      justificativa: 'Passou do limite',
    };
    expect(conferirEnvio(avaliacao, false)).toEqual([
      'Com falha crítica ou critério NAO_CONFORME, o parecer final não pode ser APROVADA',
    ]);
  });
});

describe('calcularEvidencias', () => {
  it('compara temperaturas com o limite, conta falhas e compara com a concorrente', () => {
    const evidencias = calcularEvidencias({
      maximas: { TEMPERATURA_MOTOR: 108, TEMPERATURA_HIDRAULICO: 80 },
      limites: { motor: 105, hidraulico: 85 },
      falhas: ['CRITICA', 'MENOR', 'MENOR'],
      avaliacao: avaliacaoCompleta(),
    });
    expect(evidencias).toEqual({
      temperaturaMotor: { maxima: 108, limite: 105, excedeu: true },
      temperaturaHidraulico: { maxima: 80, limite: 85, excedeu: false },
      falhasPorSeveridade: { CRITICA: 1, MAIOR: 0, MENOR: 2 },
      horasTrabalhadas: 8.5,
      diferencaConcorrente: 6.7,
    });
  });

  it('sem dados, devolve nulos em vez de inventar', () => {
    expect(
      calcularEvidencias({
        maximas: {},
        limites: { motor: null, hidraulico: null },
        falhas: [],
        avaliacao: null,
      }),
    ).toEqual({
      temperaturaMotor: { maxima: null, limite: null, excedeu: null },
      temperaturaHidraulico: { maxima: null, limite: null, excedeu: null },
      falhasPorSeveridade: { CRITICA: 0, MAIOR: 0, MENOR: 0 },
      horasTrabalhadas: null,
      diferencaConcorrente: null,
    });
  });
});
