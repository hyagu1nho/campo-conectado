import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Parecer } from '../../generated/prisma/client';

export class AvaliarCriterioDto {
  @ApiProperty({ enum: Parecer })
  @IsEnum(Parecer, {
    message: `parecer deve ser um destes: ${Object.values(Parecer).join(', ')}`,
  })
  parecer!: Parecer;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Obrigatória quando o parecer não é CONFORME',
  })
  @IsOptional()
  @IsString({ message: 'a justificativa deve ser um texto' })
  @MaxLength(1000, {
    message: 'a justificativa deve ter no máximo 1000 caracteres',
  })
  justificativa?: string;
}
