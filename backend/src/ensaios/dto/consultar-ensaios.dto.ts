import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ConsultarPaginadoDto } from '../../comum/dto/consultar-paginado.dto';
import { SituacaoEnsaio } from '../../generated/prisma/client';

export class ConsultarEnsaiosDto extends ConsultarPaginadoDto {
  @ApiPropertyOptional({ enum: SituacaoEnsaio })
  @IsOptional()
  @IsEnum(SituacaoEnsaio, {
    message: `situacao deve ser uma destas: ${Object.values(SituacaoEnsaio).join(', ')}`,
  })
  situacao?: SituacaoEnsaio;

  @ApiPropertyOptional({ description: 'Ignorado para o perfil ANALISTA' })
  @IsOptional()
  @IsInt({ message: 'analistaId deve ser um número inteiro' })
  @IsPositive({ message: 'analistaId deve ser maior que zero' })
  analistaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'maquinaId deve ser um número inteiro' })
  @IsPositive({ message: 'maquinaId deve ser maior que zero' })
  maquinaId?: number;
}
