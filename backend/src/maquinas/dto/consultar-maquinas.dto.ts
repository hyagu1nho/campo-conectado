import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ConsultarPaginadoDto } from '../../comum/dto/consultar-paginado.dto';
import { Linha } from '../../generated/prisma/client';

export class ConsultarMaquinasDto extends ConsultarPaginadoDto {
  @ApiPropertyOptional({ enum: Linha })
  @IsOptional()
  @IsEnum(Linha, {
    message: 'linha deve ser DISTRIBUICAO, PULVERIZACAO ou PLANTIO',
  })
  linha?: Linha;

  @ApiPropertyOptional({
    description: 'Parte do modelo ou do número de série',
  })
  @IsOptional()
  @IsString({ message: 'busca deve ser um texto' })
  busca?: string;
}
