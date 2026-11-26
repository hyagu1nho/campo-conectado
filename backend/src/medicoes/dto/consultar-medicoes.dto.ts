import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ConsultarPaginadoDto } from '../../comum/dto/consultar-paginado.dto';
import { Grandeza } from '../../generated/prisma/client';

export class ConsultarMedicoesDto extends ConsultarPaginadoDto {
  @ApiPropertyOptional({ enum: Grandeza })
  @IsOptional()
  @IsEnum(Grandeza, {
    message: `grandeza deve ser uma destas: ${Object.values(Grandeza).join(', ')}`,
  })
  grandeza?: Grandeza;
}
