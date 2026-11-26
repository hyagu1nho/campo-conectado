import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Area } from '../generated/prisma/client';

/**
 * Representação de saída de uma área. Montada campo a campo para não expor
 * o modelo do banco e para converter `hectares` (Decimal no Prisma) em número.
 */
export class AreaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Área Norte' })
  nome: string;

  @ApiProperty({ example: 'Campo experimental, talhão 3' })
  localizacao: string;

  @ApiPropertyOptional({ example: 42.5, nullable: true, type: Number })
  hectares: number | null;

  @ApiPropertyOptional({
    example: 'Latossolo vermelho',
    nullable: true,
    type: String,
  })
  tipoSolo: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  observacoes: string | null;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;

  constructor(area: Area) {
    this.id = area.id;
    this.nome = area.nome;
    this.localizacao = area.localizacao;
    this.hectares = area.hectares === null ? null : area.hectares.toNumber();
    this.tipoSolo = area.tipoSolo;
    this.observacoes = area.observacoes;
    this.criadoEm = area.criadoEm;
    this.atualizadoEm = area.atualizadoEm;
  }
}
