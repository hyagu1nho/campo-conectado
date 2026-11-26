import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { NaoFuturo } from '../../comum/validadores/nao-futuro';
import { Grandeza } from '../../generated/prisma/client';

export class CriarMedicaoDto {
  @ApiProperty({ enum: Grandeza })
  @IsEnum(Grandeza, {
    message: `grandeza deve ser uma destas: ${Object.values(Grandeza).join(', ')}`,
  })
  grandeza!: Grandeza;

  @ApiProperty({ example: 92.5, description: 'Até 3 casas decimais' })
  @IsNumber(
    { maxDecimalPlaces: 3, allowNaN: false, allowInfinity: false },
    { message: 'o valor deve ser um número com até 3 casas decimais' },
  )
  valor!: number;

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

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString({ message: 'a observação deve ser um texto' })
  @MaxLength(500, { message: 'a observação deve ter no máximo 500 caracteres' })
  observacao?: string;

  @ApiPropertyOptional({
    example: '2026-12-01T14:30:00-03:00',
    description: 'Quando foi medida; se ausente, a hora do servidor',
  })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'registradaEm deve ser uma data e hora ISO 8601' },
  )
  @NaoFuturo({ message: 'registradaEm não pode estar no futuro' })
  registradaEm?: string;
}
