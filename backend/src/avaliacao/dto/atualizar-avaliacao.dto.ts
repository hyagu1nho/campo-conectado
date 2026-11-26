import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ParecerFinal } from '../../generated/prisma/client';

/**
 * Campos objetivos e parecer final. Tudo opcional, para o app salvar aos
 * poucos; o que não vem fica como está, e null apaga o valor.
 */
export class AtualizarAvaliacaoDto {
  @ApiPropertyOptional({ example: 18.5, description: 'km/h', nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'a velocidade deve ser um número com até 2 casas decimais' },
  )
  @IsPositive({ message: 'a velocidade deve ser maior que zero' })
  velocidade?: number | null;

  @ApiPropertyOptional({ example: 'Ondulado', maxLength: 120, nullable: true })
  @IsOptional()
  @IsString({ message: 'o terreno deve ser um texto' })
  @MaxLength(120, { message: 'o terreno deve ter no máximo 120 caracteres' })
  terreno?: string | null;

  @ApiPropertyOptional({ example: 1520.4, nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'o horímetro inicial deve ter até 1 casa decimal' },
  )
  @Min(0, { message: 'o horímetro inicial não pode ser negativo' })
  horimetroInicial?: number | null;

  @ApiPropertyOptional({ example: 1528.9, nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 1 },
    { message: 'o horímetro final deve ter até 1 casa decimal' },
  )
  @Min(0, { message: 'o horímetro final não pode ser negativo' })
  horimetroFinal?: number | null;

  @ApiPropertyOptional({ example: 32.5, description: 'ha/h', nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'a capacidade operacional deve ser um número com até 2 casas decimais',
    },
  )
  @IsPositive({ message: 'a capacidade operacional deve ser maior que zero' })
  capacidadeOperacional?: number | null;

  @ApiPropertyOptional({
    example: 30,
    description: 'ha/h da máquina concorrente',
    nullable: true,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'a capacidade da concorrente deve ser um número com até 2 casas decimais',
    },
  )
  @IsPositive({
    message: 'a capacidade da concorrente deve ser maior que zero',
  })
  capacidadeConcorrente?: number | null;

  @ApiPropertyOptional({ enum: ParecerFinal, nullable: true })
  @IsOptional()
  @IsEnum(ParecerFinal, {
    message: `parecerFinal deve ser um destes: ${Object.values(ParecerFinal).join(', ')}`,
  })
  parecerFinal?: ParecerFinal | null;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString({ message: 'a justificativa final deve ser um texto' })
  @MaxLength(1000, {
    message: 'a justificativa final deve ter no máximo 1000 caracteres',
  })
  justificativaFinal?: string | null;
}
