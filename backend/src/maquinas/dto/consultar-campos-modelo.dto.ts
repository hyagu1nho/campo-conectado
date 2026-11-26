import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Linha } from '../../generated/prisma/client';

export class ConsultarCamposModeloDto {
  @ApiProperty({ enum: Linha })
  @IsEnum(Linha, {
    message: 'linha deve ser DISTRIBUICAO, PULVERIZACAO ou PLANTIO',
  })
  linha!: Linha;
}
