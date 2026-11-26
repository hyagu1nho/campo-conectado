import { BadRequestException, Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { abrirParaLeitura, abrirParaRegistro } from '../ensaios/acesso-ensaio';
import { Criterio, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AvaliacaoEntity } from './avaliacao.entity';
import { carregarAvaliacao, garantirPulverizacao } from './contexto';
import { AtualizarAvaliacaoDto } from './dto/atualizar-avaliacao.dto';
import { AvaliarCriterioDto } from './dto/avaliar-criterio.dto';
import {
  exigeJustificativa,
  horimetrosInvertidos,
  ROTULOS_CRITERIO,
} from './regras';

type ClienteTransacao = Prisma.TransactionClient;

const vazio = (texto?: string | null) => !texto || texto.trim() === '';

@Injectable()
export class AvaliacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(
    ensaioId: number,
    usuario: UsuarioAutenticado,
  ): Promise<AvaliacaoEntity> {
    await abrirParaLeitura(this.prisma, ensaioId, usuario);
    const contexto = await carregarAvaliacao(this.prisma, ensaioId);
    garantirPulverizacao(contexto.linha);
    return new AvaliacaoEntity(contexto);
  }

  /**
   * Salva os campos objetivos e o parecer final. Confere já o que dá para
   * conferir sozinho (horímetros e justificativa do parecer final); as
   * regras que dependem de falhas e critérios ficam para o envio.
   */
  async atualizar(
    ensaioId: number,
    dto: AtualizarAvaliacaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<AvaliacaoEntity> {
    return this.prisma.$transaction(async (tx) => {
      await this.abrir(tx, ensaioId, usuario);
      const atual = await tx.avaliacaoPulverizacao.findUnique({
        where: { ensaioId },
      });

      const valor = <T>(novo: T | undefined, antigo: T) =>
        novo === undefined ? antigo : novo;
      const inicial = valor(
        dto.horimetroInicial,
        atual?.horimetroInicial?.toNumber() ?? null,
      );
      const final = valor(
        dto.horimetroFinal,
        atual?.horimetroFinal?.toNumber() ?? null,
      );
      const parecerFinal = valor(dto.parecerFinal, atual?.parecerFinal ?? null);
      const justificativaFinal = valor(
        dto.justificativaFinal,
        atual?.justificativaFinal ?? null,
      );

      const erros: string[] = [];
      if (horimetrosInvertidos(inicial, final)) {
        erros.push('O horímetro final deve ser maior ou igual ao inicial');
      }
      if (
        parecerFinal &&
        exigeJustificativa(parecerFinal) &&
        vazio(justificativaFinal)
      ) {
        erros.push(`Parecer final ${parecerFinal} exige justificativa`);
      }
      if (erros.length > 0) throw new BadRequestException(erros);

      const dados = {
        velocidade: dto.velocidade,
        terreno: dto.terreno,
        horimetroInicial: dto.horimetroInicial,
        horimetroFinal: dto.horimetroFinal,
        capacidadeOperacional: dto.capacidadeOperacional,
        capacidadeConcorrente: dto.capacidadeConcorrente,
        parecerFinal: dto.parecerFinal,
        justificativaFinal: dto.justificativaFinal,
      };
      await tx.avaliacaoPulverizacao.upsert({
        where: { ensaioId },
        create: { ensaioId, ...dados },
        update: dados,
      });
      return new AvaliacaoEntity(await carregarAvaliacao(tx, ensaioId));
    });
  }

  /** Salva o parecer de um critério; é o "salvar ao avançar" do app. */
  async avaliarCriterio(
    ensaioId: number,
    criterio: Criterio,
    dto: AvaliarCriterioDto,
    usuario: UsuarioAutenticado,
  ): Promise<AvaliacaoEntity> {
    if (exigeJustificativa(dto.parecer) && vazio(dto.justificativa)) {
      throw new BadRequestException(
        `${ROTULOS_CRITERIO[criterio]}: parecer ${dto.parecer} exige justificativa`,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await this.abrir(tx, ensaioId, usuario);
      const { id: avaliacaoId } = await tx.avaliacaoPulverizacao.upsert({
        where: { ensaioId },
        create: { ensaioId },
        update: {},
        select: { id: true },
      });
      const dados = {
        parecer: dto.parecer,
        justificativa: vazio(dto.justificativa) ? null : dto.justificativa,
      };
      await tx.criterioAvaliado.upsert({
        where: { avaliacaoId_criterio: { avaliacaoId, criterio } },
        create: { avaliacaoId, criterio, ...dados },
        update: dados,
      });
      return new AvaliacaoEntity(await carregarAvaliacao(tx, ensaioId));
    });
  }

  /** Acesso, situação que aceita registro e linha da máquina. */
  private async abrir(
    tx: ClienteTransacao,
    ensaioId: number,
    usuario: UsuarioAutenticado,
  ) {
    await abrirParaRegistro(tx, ensaioId, usuario);
    const { maquina } = await tx.ensaio.findUniqueOrThrow({
      where: { id: ensaioId },
      select: { maquina: { select: { linha: true } } },
    });
    garantirPulverizacao(maquina.linha);
  }
}
