import { SituacaoEnsaio } from '../generated/prisma/client';
import { AcaoEnsaio, conferirRegistro, transicao } from './ciclo';

describe('ciclo de vida do ensaio', () => {
  const casosValidos: [AcaoEnsaio, SituacaoEnsaio, SituacaoEnsaio][] = [
    ['INICIAR', 'PLANEJADO', 'EM_ANDAMENTO'],
    ['ENVIAR', 'EM_ANDAMENTO', 'ENVIADO'],
    ['ENVIAR', 'DEVOLVIDO', 'ENVIADO'],
    ['DEVOLVER', 'ENVIADO', 'DEVOLVIDO'],
    ['CONCLUIR', 'ENVIADO', 'CONCLUIDO'],
  ];

  it.each(casosValidos)('%s em %s leva a %s', (acao, de, para) => {
    expect(transicao(acao, de)).toEqual({ para });
  });

  it('recusa toda combinação fora da tabela', () => {
    const todas = Object.values(SituacaoEnsaio);
    const acoes: AcaoEnsaio[] = ['INICIAR', 'ENVIAR', 'DEVOLVER', 'CONCLUIR'];
    for (const acao of acoes) {
      for (const de of todas) {
        const valido = casosValidos.some(([a, d]) => a === acao && d === de);
        if (!valido) expect(transicao(acao, de)).toHaveProperty('erro');
      }
    }
  });

  it('a mensagem diz a situação atual e as aceitas', () => {
    expect(transicao('ENVIAR', 'PLANEJADO')).toEqual({
      erro: 'Ensaio PLANEJADO não pode ser enviado; só EM_ANDAMENTO ou DEVOLVIDO',
    });
  });

  it('ensaio concluído não muda mais', () => {
    expect(transicao('DEVOLVER', 'CONCLUIDO')).toHaveProperty('erro');
  });
});

describe('registro de dados no ensaio', () => {
  it.each(['PLANEJADO', 'EM_ANDAMENTO', 'DEVOLVIDO'] as SituacaoEnsaio[])(
    '%s aceita medições e falhas',
    (situacao) => {
      expect(conferirRegistro(situacao)).toBeNull();
    },
  );

  it.each(['ENVIADO', 'CONCLUIDO'] as SituacaoEnsaio[])(
    '%s não aceita, com mensagem clara',
    (situacao) => {
      expect(conferirRegistro(situacao)).toBe(
        `Ensaio ${situacao} não aceita registros; só PLANEJADO, EM_ANDAMENTO ou DEVOLVIDO`,
      );
    },
  );
});
