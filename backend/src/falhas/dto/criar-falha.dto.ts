import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { NaoFuturo } from '../../comum/validadores/nao-futuro';
import { Severidade } from '../../generated/prisma/client';

export class CriarFalhaDto {
  @ApiProperty({
    example: 'Vazamento na mangueira do retorno do hidráulico',
    maxLength: 1000,
  })
  @IsString({ message: 'a descrição deve ser um texto' })
  @IsNotEmpty({ message: 'a descrição é obrigatória' })
  @MaxLength(1000, {
    message: 'a descrição deve ter no máximo 1000 caracteres',
  })
  descricao!: string;

  @ApiPropertyOptional({ example: 'Sistema hidráulico', maxLength: 120 })
  @IsOptional()
  @IsString({ message: 'o componente deve ser um texto' })
  @MaxLength(120, { message: 'o componente deve ter no máximo 120 caracteres' })
  componente?: string;

  @ApiProperty({ enum: Severidade })
  @IsEnum(Severidade, {
    message: `severidade deve ser uma destas: ${Object.values(Severidade).join(', ')}`,
  })
  severidade!: Severidade;

  @ApiPropertyOptional({
    example: 1520.4,
    description: 'Horas de uso da máquina',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'o horímetro deve ser um número com até 1 casa decimal' },
  )
  @Min(0, { message: 'o horímetro não pode ser negativo' })
  horimetro?: number;

  @ApiPropertyOptional({
    example: '2026-12-01T15:10:00-03:00',
    description: 'Quando ocorreu; se ausente, a hora do servidor',
  })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'ocorridaEm deve ser uma data e hora ISO 8601' },
  )
  @NaoFuturo({ message: 'ocorridaEm não pode estar no futuro' })
  ocorridaEm?: string;
}
