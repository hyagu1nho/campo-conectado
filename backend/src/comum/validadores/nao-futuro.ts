import { ValidateBy, ValidationOptions } from 'class-validator';

/** Margem para diferença de relógio entre o celular e o servidor. */
const TOLERANCIA_MS = 5 * 60 * 1000;

/** A data e hora (texto ISO 8601) não pode estar no futuro. */
export function NaoFuturo(opcoes?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'naoFuturo',
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' &&
          new Date(valor).getTime() <= Date.now() + TOLERANCIA_MS,
      },
    },
    opcoes,
  );
}
