import { Injectable, NotFoundException } from '@nestjs/common';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { paginar, Paginado } from '../comum/dto/consultar-paginado.dto';
import { abrirParaLeitura, abrirParaRegistro } from '../ensaios/acesso-ensaio';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultarMedicoesDto } from './dto/consultar-medicoes.dto';
import { CriarMedicaoDto } from './dto/criar-medicao.dto';
import { MedicaoEntity } from './medicao.entity';

@Injectable()
export class MedicoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    ensaioId: number,
    consulta: ConsultarMedicoesDto,
    usuario: UsuarioAutenticado,
  ): Promise<Paginado<MedicaoEntity>> {
    await abrirParaLeitura(this.prisma, ensaioId, usuario);
    const { pagina, tamanho, grandeza } = consulta;
    const where: Prisma.MedicaoWhereInput = {
      ensaioId,
      ...(grandeza && { grandeza }),
    };

    const [medicoes, total] = await this.prisma.$transaction([
      this.prisma.medicao.findMany({
        where,
        orderBy: [{ registradaEm: 'asc' }, { id: 'asc' }],
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.medicao.count({ where }),
    ]);

    return paginar(
      medicoes.map((medicao) => new MedicaoEntity(medicao)),
      total,
      consulta,
    );
  }

  async criar(
    ensaioId: number,
    dto: CriarMedicaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<MedicaoEntity> {
    const medicao = await this.prisma.$transaction(async (tx) => {
      await abrirParaRegistro(tx, ensaioId, usuario);
      return tx.medicao.create({
        data: {
          ensaioId,
          grandeza: dto.grandeza,
          valor: dto.valor,
          horimetro: dto.horimetro,
          observacao: dto.observacao,
          ...(dto.registradaEm && { registradaEm: new Date(dto.registradaEm) }),
        },
      });
    });
    return new MedicaoEntity(medicao);
  }

  /** Para corrigir um lançamento errado: apaga e registra de novo. */
  async remover(
    ensaioId: number,
    id: number,
    usuario: UsuarioAutenticado,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await abrirParaRegistro(tx, ensaioId, usuario);
      const { count } = await tx.medicao.deleteMany({
        where: { id, ensaioId },
      });
      if (count === 0) {
        throw new NotFoundException(
          `Medição ${id} não encontrada no ensaio ${ensaioId}`,
        );
      }
    });
  }
}
