import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { paginar, Paginado } from '../comum/dto/consultar-paginado.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AreaEntity } from './area.entity';
import { AtualizarAreaDto } from './dto/atualizar-area.dto';
import { ConsultarAreasDto } from './dto/consultar-areas.dto';
import { CriarAreaDto } from './dto/criar-area.dto';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(consulta: ConsultarAreasDto): Promise<Paginado<AreaEntity>> {
    const { pagina, tamanho, nome } = consulta;
    const where: Prisma.AreaWhereInput = nome
      ? { nome: { contains: nome, mode: 'insensitive' } }
      : {};

    const [areas, total] = await this.prisma.$transaction([
      this.prisma.area.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.area.count({ where }),
    ]);

    return paginar(
      areas.map((area) => new AreaEntity(area)),
      total,
      consulta,
    );
  }

  async buscarPorId(id: number): Promise<AreaEntity> {
    const area = await this.prisma.area.findUnique({ where: { id } });
    if (!area) throw new NotFoundException(`Área ${id} não encontrada`);
    return new AreaEntity(area);
  }

  async criar(dto: CriarAreaDto): Promise<AreaEntity> {
    try {
      return new AreaEntity(await this.prisma.area.create({ data: dto }));
    } catch (erro) {
      this.traduzirErro(erro, { nome: dto.nome });
    }
  }

  async atualizar(id: number, dto: AtualizarAreaDto): Promise<AreaEntity> {
    try {
      const area = await this.prisma.area.update({ where: { id }, data: dto });
      return new AreaEntity(area);
    } catch (erro) {
      this.traduzirErro(erro, { id, nome: dto.nome });
    }
  }

  async remover(id: number): Promise<void> {
    try {
      await this.prisma.area.delete({ where: { id } });
    } catch (erro) {
      this.traduzirErro(erro, { id });
    }
  }

  /**
   * Converte erros conhecidos do Prisma em respostas HTTP.
   * A mensagem do Prisma nunca é repassada: ela expõe tabela e coluna.
   */
  private traduzirErro(
    erro: unknown,
    contexto: { id?: number; nome?: string },
  ): never {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      switch (erro.code) {
        case 'P2002':
          throw new ConflictException(
            `Já existe uma área com o nome ${contexto.nome}`,
          );
        case 'P2025':
          throw new NotFoundException(`Área ${contexto.id} não encontrada`);
        case 'P2003':
          throw new ConflictException(
            `Área ${contexto.id} possui ensaios vinculados e não pode ser removida`,
          );
      }
    }
    throw erro;
  }
}
