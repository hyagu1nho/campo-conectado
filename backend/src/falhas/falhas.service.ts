import { Injectable, NotFoundException } from '@nestjs/common';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { paginar, Paginado } from '../comum/dto/consultar-paginado.dto';
import { abrirParaLeitura, abrirParaRegistro } from '../ensaios/acesso-ensaio';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultarFalhasDto } from './dto/consultar-falhas.dto';
import { CriarFalhaDto } from './dto/criar-falha.dto';
import { FalhaEntity } from './falha.entity';

@Injectable()
export class FalhasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    ensaioId: number,
    consulta: ConsultarFalhasDto,
    usuario: UsuarioAutenticado,
  ): Promise<Paginado<FalhaEntity>> {
    await abrirParaLeitura(this.prisma, ensaioId, usuario);
    const { pagina, tamanho, severidade } = consulta;
    const where: Prisma.FalhaWhereInput = {
      ensaioId,
      ...(severidade && { severidade }),
    };

    const [falhas, total] = await this.prisma.$transaction([
      this.prisma.falha.findMany({
        where,
        orderBy: [{ ocorridaEm: 'asc' }, { id: 'asc' }],
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.falha.count({ where }),
    ]);

    return paginar(
      falhas.map((falha) => new FalhaEntity(falha)),
      total,
      consulta,
    );
  }

  async criar(
    ensaioId: number,
    dto: CriarFalhaDto,
    usuario: UsuarioAutenticado,
  ): Promise<FalhaEntity> {
    const falha = await this.prisma.$transaction(async (tx) => {
      await abrirParaRegistro(tx, ensaioId, usuario);
      return tx.falha.create({
        data: {
          ensaioId,
          descricao: dto.descricao,
          componente: dto.componente,
          severidade: dto.severidade,
          horimetro: dto.horimetro,
          ...(dto.ocorridaEm && { ocorridaEm: new Date(dto.ocorridaEm) }),
        },
      });
    });
    return new FalhaEntity(falha);
  }

  /** Para corrigir um lançamento errado: apaga e registra de novo. */
  async remover(
    ensaioId: number,
    id: number,
    usuario: UsuarioAutenticado,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await abrirParaRegistro(tx, ensaioId, usuario);
      const { count } = await tx.falha.deleteMany({ where: { id, ensaioId } });
      if (count === 0) {
        throw new NotFoundException(
          `Falha ${id} não encontrada no ensaio ${ensaioId}`,
        );
      }
    });
  }
}
