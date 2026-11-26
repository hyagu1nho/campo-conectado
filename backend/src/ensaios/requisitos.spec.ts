import { Grandeza, Linha } from '../generated/prisma/client';
import { conferirMedicoes } from './requisitos';

describe('medições mínimas para enviar e concluir', () => {
  const todas = Object.fromEntries(
    Object.values(Grandeza).map((grandeza) => [grandeza, 1]),
  );

  it.each(Object.values(Linha))(
    '%s: uma medição de cada grandeza basta',
    (linha) => {
      expect(conferirMedicoes(linha, todas)).toEqual([]);
    },
  );

  it('aponta cada grandeza sem medição, pelo rótulo', () => {
    expect(
      conferirMedicoes('PULVERIZACAO', { TEMPERATURA_MOTOR: 5, VELOCIDADE: 2 }),
    ).toEqual([
      'Falta ao menos uma medição de: Temperatura do sistema hidráulico',
      'Falta ao menos uma medição de: Consumo de combustível',
    ]);
  });

  it('contagem zero conta como falta', () => {
    expect(conferirMedicoes('PLANTIO', { ...todas, VELOCIDADE: 0 })).toEqual([
      'Falta ao menos uma medição de: Velocidade',
    ]);
  });
});
