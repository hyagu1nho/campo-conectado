import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Parâmetros de paginação comuns a toda listagem da API. */
export class ConsultarPaginadoDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt({ message: 'pagina deve ser um número inteiro' })
  @Min(1, { message: 'pagina deve ser no mínimo 1' })
  pagina: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt({ message: 'tamanho deve ser um número inteiro' })
  @Min(1, { message: 'tamanho deve ser no mínimo 1' })
  @Max(100, { message: 'tamanho deve ser no máximo 100' })
  tamanho: number = 20;
}

/** Resposta de toda listagem paginada. */
export interface Paginado<T> {
  dados: T[];
  pagina: number;
  tamanho: number;
  total: number;
  totalDePaginas: number;
}

export function paginar<T>(
  dados: T[],
  total: number,
  { pagina, tamanho }: ConsultarPaginadoDto,
): Paginado<T> {
  return {
    dados,
    pagina,
    tamanho,
    total,
    totalDePaginas: Math.ceil(total / tamanho) || 1,
  };
}
