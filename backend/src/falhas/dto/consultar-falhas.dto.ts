import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ConsultarPaginadoDto } from '../../comum/dto/consultar-paginado.dto';
import { Severidade } from '../../generated/prisma/client';

export class ConsultarFalhasDto extends ConsultarPaginadoDto {
  @ApiPropertyOptional({ enum: Severidade })
  @IsOptional()
  @IsEnum(Severidade, {
    message: `severidade deve ser uma destas: ${Object.values(Severidade).join(', ')}`,
  })
  severidade?: Severidade;
}
