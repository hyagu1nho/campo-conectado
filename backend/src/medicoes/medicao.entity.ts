import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Medicao } from '../generated/prisma/client';
import { Grandeza } from '../generated/prisma/client';

export class MedicaoEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: Grandeza })
  grandeza: Grandeza;

  @ApiProperty({ example: 92.5 })
  valor: number;

  @ApiPropertyOptional({ nullable: true, type: Number })
  horimetro: number | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  observacao: string | null;

  @ApiProperty()
  registradaEm: Date;

  constructor(medicao: Medicao) {
    this.id = medicao.id;
    this.grandeza = medicao.grandeza;
    this.valor = medicao.valor.toNumber();
    this.horimetro = medicao.horimetro?.toNumber() ?? null;
    this.observacao = medicao.observacao;
    this.registradaEm = medicao.registradaEm;
  }
}
