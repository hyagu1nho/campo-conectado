import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Criterio, Parecer, ParecerFinal } from '../generated/prisma/client';
import type { ContextoAvaliacao } from './contexto';
import { ROTULOS_CRITERIO } from './regras';

class CriterioAvaliadoEntity {
  @ApiProperty({ enum: Criterio })
  criterio: Criterio;

  @ApiProperty({ example: 'Estabilidade das barras' })
  rotulo: string;

  @ApiPropertyOptional({ enum: Parecer, nullable: true })
  parecer: Parecer | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  justificativa: string | null;
}

class TemperaturaEntity {
  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Maior medição',
  })
  maxima: number | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Da ficha da máquina',
  })
  limite: number | null;

  @ApiPropertyOptional({ nullable: true, type: Boolean })
  excedeu: boolean | null;
}

class EvidenciasEntity {
  @ApiProperty({ type: TemperaturaEntity })
  temperaturaMotor: TemperaturaEntity;

  @ApiProperty({ type: TemperaturaEntity })
  temperaturaHidraulico: TemperaturaEntity;

  @ApiProperty({ example: { CRITICA: 0, MAIOR: 1, MENOR: 2 } })
  falhasPorSeveridade: Record<string, number>;

  @ApiPropertyOptional({ nullable: true, type: Number })
  horasTrabalhadas: number | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description:
      '% da capacidade operacional acima (+) ou abaixo (-) da concorrente',
  })
  diferencaConcorrente: number | null;
}

/**
 * Resposta da avaliação: o que o analista preencheu, o que a API calculou
 * e o que ainda impede o envio. Os critérios vêm todos, na ordem do app,
 * com parecer null quando ainda não foram avaliados.
 */
export class AvaliacaoEntity {
  @ApiPropertyOptional({ nullable: true, type: Number })
  velocidade: number | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  terreno: string | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  horimetroInicial: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  horimetroFinal: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  capacidadeOperacional: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  capacidadeConcorrente: number | null;

  @ApiPropertyOptional({ enum: ParecerFinal, nullable: true })
  parecerFinal: ParecerFinal | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  justificativaFinal: string | null;

  @ApiProperty({ type: [CriterioAvaliadoEntity] })
  criterios: CriterioAvaliadoEntity[];

  @ApiProperty({ type: EvidenciasEntity })
  evidencias: EvidenciasEntity;

  @ApiProperty({ type: [String], description: 'Vazio quando pode enviar' })
  pendencias: string[];

  @ApiProperty({ example: { avaliados: 3, total: 7 } })
  progresso: { avaliados: number; total: number };

  constructor({ dados, evidencias, pendencias }: ContextoAvaliacao) {
    this.velocidade = dados?.velocidade ?? null;
    this.terreno = dados?.terreno ?? null;
    this.horimetroInicial = dados?.horimetroInicial ?? null;
    this.horimetroFinal = dados?.horimetroFinal ?? null;
    this.capacidadeOperacional = dados?.capacidadeOperacional ?? null;
    this.capacidadeConcorrente = dados?.capacidadeConcorrente ?? null;
    this.parecerFinal = dados?.parecerFinal ?? null;
    this.justificativaFinal = dados?.justificativaFinal ?? null;

    const porCriterio = new Map(dados?.criterios.map((c) => [c.criterio, c]));
    this.criterios = Object.entries(ROTULOS_CRITERIO).map(
      ([criterio, rotulo]) => {
        const avaliado = porCriterio.get(criterio as Criterio);
        return {
          criterio: criterio as Criterio,
          rotulo,
          parecer: avaliado?.parecer ?? null,
          justificativa: avaliado?.justificativa ?? null,
        };
      },
    );
    this.evidencias = evidencias;
    this.pendencias = pendencias;
    this.progresso = {
      avaliados: porCriterio.size,
      total: this.criterios.length,
    };
  }
}
