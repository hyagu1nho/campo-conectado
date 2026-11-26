import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '../generated/prisma/client';
import { Linha, SituacaoEnsaio } from '../generated/prisma/client';

/** Relações da listagem: só o necessário para identificar o ensaio. */
export const INCLUIR_RESUMO = {
  maquina: {
    select: { id: true, modelo: true, numeroSerie: true, linha: true },
  },
  area: { select: { id: true, nome: true } },
  analista: { select: { id: true, nome: true } },
} satisfies Prisma.EnsaioInclude;

/** Relações do detalhe: o resumo mais o engenheiro e as devoluções. */
export const INCLUIR_DETALHE = {
  ...INCLUIR_RESUMO,
  engenheiro: { select: { id: true, nome: true } },
  devolucoes: {
    orderBy: { criadoEm: 'desc' },
    include: { autor: { select: { id: true, nome: true } } },
  },
} satisfies Prisma.EnsaioInclude;

type EnsaioResumo = Prisma.EnsaioGetPayload<{ include: typeof INCLUIR_RESUMO }>;
type EnsaioDetalhe = Prisma.EnsaioGetPayload<{
  include: typeof INCLUIR_DETALHE;
}>;

class PessoaEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Artur' })
  nome: string;
}

class MaquinaDoEnsaioEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Pulverizador P-3000' })
  modelo: string;

  @ApiProperty({ example: 'PV-0001' })
  numeroSerie: string;

  @ApiProperty({ enum: Linha })
  linha: Linha;
}

class DevolucaoEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  comentario: string;

  @ApiProperty({ type: PessoaEntity })
  autor: PessoaEntity;

  @ApiProperty()
  criadoEm: Date;
}

/** Item da listagem de ensaios. */
export class EnsaioResumoEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  objetivo: string;

  @ApiProperty({ enum: SituacaoEnsaio })
  situacao: SituacaoEnsaio;

  @ApiProperty({ example: '2026-12-01' })
  dataPrevista: string;

  @ApiProperty({ type: MaquinaDoEnsaioEntity })
  maquina: MaquinaDoEnsaioEntity;

  @ApiProperty({ type: PessoaEntity })
  area: PessoaEntity;

  @ApiProperty({ type: PessoaEntity })
  analista: PessoaEntity;

  constructor(ensaio: EnsaioResumo) {
    this.id = ensaio.id;
    this.objetivo = ensaio.objetivo;
    this.situacao = ensaio.situacao;
    // A coluna é só data; a hora vem zerada em UTC.
    this.dataPrevista = ensaio.dataPrevista.toISOString().slice(0, 10);
    this.maquina = ensaio.maquina;
    this.area = ensaio.area;
    this.analista = ensaio.analista;
  }
}

/** Detalhe do ensaio, com o histórico de devoluções (mais recente primeiro). */
export class EnsaioEntity extends EnsaioResumoEntity {
  @ApiProperty({ type: PessoaEntity })
  engenheiro: PessoaEntity;

  @ApiPropertyOptional({ nullable: true, type: Date })
  enviadoEm: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  concluidoEm: Date | null;

  @ApiProperty({ type: [DevolucaoEntity] })
  devolucoes: DevolucaoEntity[];

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;

  constructor(ensaio: EnsaioDetalhe) {
    super(ensaio);
    this.engenheiro = ensaio.engenheiro;
    this.enviadoEm = ensaio.enviadoEm;
    this.concluidoEm = ensaio.concluidoEm;
    this.devolucoes = ensaio.devolucoes.map(
      ({ id, comentario, autor, criadoEm }) => ({
        id,
        comentario,
        autor,
        criadoEm,
      }),
    );
    this.criadoEm = ensaio.criadoEm;
    this.atualizadoEm = ensaio.atualizadoEm;
  }
}
