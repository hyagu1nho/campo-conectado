import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ConsultarPaginadoDto } from '../../comum/dto/consultar-paginado.dto';
import { Perfil } from '../../generated/prisma/client';

export class ConsultarUsuariosDto extends ConsultarPaginadoDto {
  @ApiPropertyOptional({ enum: Perfil, example: Perfil.ANALISTA })
  @IsOptional()
  @IsEnum(Perfil, { message: 'perfil deve ser ENGENHEIRO ou ANALISTA' })
  perfil?: Perfil;
}
