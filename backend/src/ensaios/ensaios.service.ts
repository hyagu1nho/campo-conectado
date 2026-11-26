import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { paginar, Paginado } from '../comum/dto/consultar-paginado.dto';
import { Prisma, SituacaoEnsaio } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { abrirParaLeitura, garantirAcesso } from './acesso-ensaio';
import { AcaoEnsaio, transicao } from './ciclo';
import { pendenciasDoEnsaio } from './pendencias';
import { AtualizarEnsaioDto } from './dto/atualizar-ensaio.dto';
import { ConsultarEnsaiosDto } from './dto/consultar-ensaios.dto';
import { CriarEnsaioDto } from './dto/criar-ensaio.dto';
import {
  EnsaioEntity,
  EnsaioResumoEntity,
  INCLUIR_DETALHE,
  INCLUIR_RESUMO,
} from './ensaio.entity';

type ClienteTransacao = Prisma.TransactionClient;

@Injectable()
export class EnsaiosService {
  constructor(private readonly prisma: PrismaService) {}

  /** O analista só enxerga os próprios ensaios; o engenheiro enxerga todos. */
  async listar(
    consulta: ConsultarEnsaiosDto,
    usuario: UsuarioAutenticado,
  ): Promise<Paginado<EnsaioResumoEntity>> {
    const { pagina, tamanho, situacao, maquinaId } = consulta;
    const analistaId =
      usuario.perfil === 'ANALISTA' ? usuario.id : consulta.analistaId;
    const where: Prisma.EnsaioWhereInput = {
      ...(situacao && { situacao }),
      ...(maquinaId && { maquinaId }),
      ...(analistaId && { analistaId }),
    };

    const [ensaios, total] = await this.prisma.$transaction([
      this.prisma.ensaio.findMany({
        where,
        include: INCLUIR_RESUMO,
        orderBy: [{ dataPrevista: 'asc' }, { id: 'asc' }],
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.ensaio.count({ where }),
    ]);

    return paginar(
      ensaios.map((ensaio) => new EnsaioResumoEntity(ensaio)),
      total,
      consulta,
    );
  }

  async buscarPorId(
    id: number,
    usuario: UsuarioAutenticado,
  ): Promise<EnsaioEntity> {
    const ensaio = await this.prisma.ensaio.findUnique({
      where: { id },
      include: INCLUIR_DETALHE,
    });
    if (!ensaio) throw new NotFoundException(`Ensaio ${id} não encontrado`);
    garantirAcesso(ensaio, usuario);
    return new EnsaioEntity(ensaio);
  }

  async criar(
    dto: CriarEnsaioDto,
    usuario: UsuarioAutenticado,
  ): Promise<EnsaioEntity> {
    await this.conferirReferencias(this.prisma, dto);
    const ensaio = await this.prisma.ensaio.create({
      data: {
        objetivo: dto.objetivo,
        maquinaId: dto.maquinaId,
        areaId: dto.areaId,
        analistaId: dto.analistaId,
        engenheiroId: usuario.id,
        dataPrevista: new Date(dto.dataPrevista),
      },
      include: INCLUIR_DETALHE,
    });
    return new EnsaioEntity(ensaio);
  }

  /** O planejamento só muda enquanto ninguém começou o ensaio. */
  async atualizar(id: number, dto: AtualizarEnsaioDto): Promise<EnsaioEntity> {
    const ensaio = await this.prisma.$transaction(async (tx) => {
      await this.garantirPlanejado(tx, id, 'alterado');
      await this.conferirReferencias(tx, dto);
      return tx.ensaio.update({
        where: { id },
        data: {
          objetivo: dto.objetivo,
          maquinaId: dto.maquinaId,
          areaId: dto.areaId,
          analistaId: dto.analistaId,
          ...(dto.dataPrevista && { dataPrevista: new Date(dto.dataPrevista) }),
        },
        include: INCLUIR_DETALHE,
      });
    });
    return new EnsaioEntity(ensaio);
  }

  async remover(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.garantirPlanejado(tx, id, 'removido');
      await tx.ensaio.delete({ where: { id } });
    });
  }

  iniciar(id: number, usuario: UsuarioAutenticado) {
    return this.mudarSituacao(id, 'INICIAR', usuario);
  }

  /** O que falta para enviar e concluir; o app e o web mostram antes. */
  async pendencias(id: number, usuario: UsuarioAutenticado) {
    await abrirParaLeitura(this.prisma, id, usuario);
    return { pendencias: await pendenciasDoEnsaio(this.prisma, id) };
  }

  /** Exige medições mínimas e, na Pulverização, a avaliação completa. */
  enviar(id: number, usuario: UsuarioAutenticado) {
    return this.mudarSituacao(id, 'ENVIAR', usuario, {
      dados: { enviadoEm: new Date() },
      conferir: (tx) => pendenciasDoEnsaio(tx, id),
    });
  }

  devolver(id: number, comentario: string, usuario: UsuarioAutenticado) {
    return this.mudarSituacao(id, 'DEVOLVER', usuario, { comentario });
  }

  /**
   * Confere de novo o que o envio conferiu. Enquanto ENVIADO o ensaio não
   * aceita registros, então só falharia se a regra mudasse no meio do caminho;
   * fica como defesa, já que concluir é irreversível.
   */
  concluir(id: number, usuario: UsuarioAutenticado) {
    return this.mudarSituacao(id, 'CONCLUIR', usuario, {
      dados: { concluidoEm: new Date() },
      conferir: (tx) => pendenciasDoEnsaio(tx, id),
    });
  }

  /**
   * Aplica uma ação da máquina de estados. O update só acontece se a
   * situação ainda for a que foi lida: se outra requisição mudou o ensaio
   * no meio do caminho, nada é gravado e a resposta é 409. `conferir`
   * devolve os requisitos que faltam para a ação (regra de negócio, 400).
   */
  private async mudarSituacao(
    id: number,
    acao: AcaoEnsaio,
    usuario: UsuarioAutenticado,
    opcoes: {
      dados?: Prisma.EnsaioUpdateManyMutationInput;
      comentario?: string;
      conferir?: (tx: ClienteTransacao) => Promise<string[]>;
    } = {},
  ): Promise<EnsaioEntity> {
    const { dados = {}, comentario, conferir } = opcoes;
    const ensaio = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.ensaio.findUnique({
        where: { id },
        select: { situacao: true, analistaId: true },
      });
      if (!atual) throw new NotFoundException(`Ensaio ${id} não encontrado`);
      garantirAcesso(atual, usuario);

      const resultado = transicao(acao, atual.situacao);
      if ('erro' in resultado) throw new ConflictException(resultado.erro);

      const pendencias = conferir ? await conferir(tx) : [];
      if (pendencias.length > 0) throw new BadRequestException(pendencias);

      const { count } = await tx.ensaio.updateMany({
        where: { id, situacao: atual.situacao },
        data: { ...dados, situacao: resultado.para },
      });
      if (count === 0) {
        throw new ConflictException(
          'O ensaio mudou de situação durante a operação; tente de novo',
        );
      }
      if (comentario) {
        await tx.devolucao.create({
          data: { ensaioId: id, autorId: usuario.id, comentario },
        });
      }
      return tx.ensaio.findUniqueOrThrow({
        where: { id },
        include: INCLUIR_DETALHE,
      });
    });
    return new EnsaioEntity(ensaio);
  }

  private async garantirPlanejado(
    tx: ClienteTransacao,
    id: number,
    participio: string,
  ) {
    const ensaio = await tx.ensaio.findUnique({
      where: { id },
      select: { situacao: true },
    });
    if (!ensaio) throw new NotFoundException(`Ensaio ${id} não encontrado`);
    if (ensaio.situacao !== SituacaoEnsaio.PLANEJADO) {
      throw new ConflictException(
        `Ensaio ${ensaio.situacao} não pode ser ${participio}; só PLANEJADO`,
      );
    }
  }

  /** Confere de uma vez máquina, área e analista; junta todos os erros. */
  private async conferirReferencias(
    cliente: ClienteTransacao | PrismaService,
    ids: { maquinaId?: number; areaId?: number; analistaId?: number },
  ) {
    // Em sequência: pode rodar dentro de transação interativa (uma conexão só).
    const maquina =
      ids.maquinaId &&
      (await cliente.maquina.findUnique({ where: { id: ids.maquinaId } }));
    const area =
      ids.areaId &&
      (await cliente.area.findUnique({ where: { id: ids.areaId } }));
    const analista =
      ids.analistaId &&
      (await cliente.usuario.findUnique({ where: { id: ids.analistaId } }));

    const erros: string[] = [];
    if (ids.maquinaId && !maquina) {
      erros.push(`Máquina ${ids.maquinaId} não encontrada`);
    }
    if (ids.areaId && !area) erros.push(`Área ${ids.areaId} não encontrada`);
    if (ids.analistaId && (!analista || analista.perfil !== 'ANALISTA')) {
      erros.push(`Usuário ${ids.analistaId} não é um analista`);
    }
    if (erros.length > 0) throw new BadRequestException(erros);
  }
}
