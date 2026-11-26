import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CampoAdicionalDto {
  @ApiProperty({ example: 'Marcador de linha', maxLength: 80 })
  @IsString({ message: 'o nome do campo adicional deve ser um texto' })
  @IsNotEmpty({ message: 'o nome do campo adicional é obrigatório' })
  @MaxLength(80, {
    message: 'o nome do campo adicional deve ter no máximo 80 caracteres',
  })
  nome!: string;

  @ApiProperty({ example: 'Hidráulico', maxLength: 200 })
  @IsString({ message: 'o valor do campo adicional deve ser um texto' })
  @IsNotEmpty({ message: 'o valor do campo adicional é obrigatório' })
  @MaxLength(200, {
    message: 'o valor do campo adicional deve ter no máximo 200 caracteres',
  })
  valor!: string;

  @ApiPropertyOptional({ example: 'bar', maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'a unidade deve ser um texto' })
  @MaxLength(20, { message: 'a unidade deve ter no máximo 20 caracteres' })
  unidade?: string;
}
