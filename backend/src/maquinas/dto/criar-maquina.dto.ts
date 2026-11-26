import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Linha, TipoMaquina } from '../../generated/prisma/client';
import { CampoAdicionalDto } from './campo-adicional.dto';

export const MAXIMO_CAMPOS_ADICIONAIS = 20;

export class CriarMaquinaDto {
  @ApiProperty({ example: 'Pulverizador P-3000', maxLength: 120 })
  @IsString({ message: 'o modelo deve ser um texto' })
  @IsNotEmpty({ message: 'o modelo é obrigatório' })
  @MaxLength(120, { message: 'o modelo deve ter no máximo 120 caracteres' })
  modelo!: string;

  @ApiProperty({ example: 'PV-0002', maxLength: 60 })
  @IsString({ message: 'o número de série deve ser um texto' })
  @IsNotEmpty({ message: 'o número de série é obrigatório' })
  @MaxLength(60, {
    message: 'o número de série deve ter no máximo 60 caracteres',
  })
  numeroSerie!: string;

  @ApiProperty({ enum: Linha })
  @IsEnum(Linha, {
    message: 'linha deve ser DISTRIBUICAO, PULVERIZACAO ou PLANTIO',
  })
  linha!: Linha;

  @ApiProperty({ enum: TipoMaquina })
  @IsEnum(TipoMaquina, {
    message: 'tipo deve ser ARRASTO, AUTOPROPELIDO ou MONTADA',
  })
  tipo!: TipoMaquina;

  /**
   * Valores dos campos pré-prontos da linha, por chave. Os campos de cada
   * linha vêm de GET /campos-modelo?linha=... A API confere tipo, faixa,
   * opções e obrigatoriedade.
   */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      capacidadeTanque: 3000,
      comprimentoBarras: 36,
      espacamentoBicos: 50,
      potenciaMotor: 250,
      limiteTemperaturaMotor: 105,
      limiteTemperaturaHidraulico: 85,
    },
  })
  @IsObject({ message: 'a ficha deve ser um objeto { chave: valor }' })
  ficha!: Record<string, unknown>;

  @ApiPropertyOptional({ type: [CampoAdicionalDto] })
  @IsOptional()
  @IsArray({ message: 'camposAdicionais deve ser uma lista' })
  @ArrayMaxSize(MAXIMO_CAMPOS_ADICIONAIS, {
    message: `a máquina pode ter no máximo ${MAXIMO_CAMPOS_ADICIONAIS} campos adicionais`,
  })
  @ValidateNested({ each: true })
  @Type(() => CampoAdicionalDto)
  camposAdicionais?: CampoAdicionalDto[];
}
