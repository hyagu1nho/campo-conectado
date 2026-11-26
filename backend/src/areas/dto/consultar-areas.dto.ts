import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ConsultarPaginadoDto } from '../../comum/dto/consultar-paginado.dto';

export class ConsultarAreasDto extends ConsultarPaginadoDto {
  @ApiPropertyOptional({
    description: 'Parte do nome, sem diferenciar maiúsculas',
  })
  @IsOptional()
  @IsString({ message: 'nome deve ser um texto' })
  nome?: string;
}
