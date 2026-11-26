import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** Planejar o ensaio já é atribuí-lo: a máquina, a área e o analista vêm juntos. */
export class CriarEnsaioDto {
  @ApiProperty({
    example: 'Validar estabilidade das barras em terreno ondulado',
    maxLength: 200,
  })
  @IsString({ message: 'o objetivo deve ser um texto' })
  @IsNotEmpty({ message: 'o objetivo é obrigatório' })
  @MaxLength(200, { message: 'o objetivo deve ter no máximo 200 caracteres' })
  objetivo!: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'maquinaId deve ser um número inteiro' })
  @IsPositive({ message: 'maquinaId deve ser maior que zero' })
  maquinaId!: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'areaId deve ser um número inteiro' })
  @IsPositive({ message: 'areaId deve ser maior que zero' })
  areaId!: number;

  @ApiProperty({ example: 2, description: 'Usuário com perfil ANALISTA' })
  @IsInt({ message: 'analistaId deve ser um número inteiro' })
  @IsPositive({ message: 'analistaId deve ser maior que zero' })
  analistaId!: number;

  @ApiProperty({
    example: '2026-12-01',
    description: 'Data no formato AAAA-MM-DD',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'a data prevista deve estar no formato AAAA-MM-DD',
  })
  @IsDateString({ strict: true }, { message: 'a data prevista é inválida' })
  dataPrevista!: string;
}
