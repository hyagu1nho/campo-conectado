import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CriarAreaDto {
  @ApiProperty({ example: 'Área Norte', maxLength: 120 })
  @IsString({ message: 'o nome deve ser um texto' })
  @IsNotEmpty({ message: 'o nome é obrigatório' })
  @MaxLength(120, { message: 'o nome deve ter no máximo 120 caracteres' })
  nome!: string;

  @ApiProperty({ example: 'Campo experimental, talhão 3', maxLength: 200 })
  @IsString({ message: 'a localização deve ser um texto' })
  @IsNotEmpty({ message: 'a localização é obrigatória' })
  @MaxLength(200, {
    message: 'a localização deve ter no máximo 200 caracteres',
  })
  localizacao!: string;

  @ApiPropertyOptional({ example: 42.5, description: 'Tamanho em hectares' })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'hectares deve ser um número com até 2 casas decimais' },
  )
  @IsPositive({ message: 'hectares deve ser maior que zero' })
  hectares?: number;

  @ApiPropertyOptional({ example: 'Latossolo vermelho', maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'o tipo de solo deve ser um texto' })
  @MaxLength(80, { message: 'o tipo de solo deve ter no máximo 80 caracteres' })
  tipoSolo?: string;

  @ApiPropertyOptional({ example: 'Terreno com declive leve' })
  @IsOptional()
  @IsString({ message: 'as observações devem ser um texto' })
  observacoes?: string;
}
