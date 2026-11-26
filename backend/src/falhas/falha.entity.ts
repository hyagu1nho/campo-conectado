import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Falha } from '../generated/prisma/client';
import { Severidade } from '../generated/prisma/client';

export class FalhaEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  descricao: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  componente: string | null;

  @ApiProperty({ enum: Severidade })
  severidade: Severidade;

  @ApiPropertyOptional({ nullable: true, type: Number })
  horimetro: number | null;

  @ApiProperty()
  ocorridaEm: Date;

  constructor(falha: Falha) {
    this.id = falha.id;
    this.descricao = falha.descricao;
    this.componente = falha.componente;
    this.severidade = falha.severidade;
    this.horimetro = falha.horimetro?.toNumber() ?? null;
    this.ocorridaEm = falha.ocorridaEm;
  }
}
