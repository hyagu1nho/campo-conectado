import { Injectable } from '@nestjs/common';
import { paginar, Paginado } from '../comum/dto/consultar-paginado.dto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultarUsuariosDto } from './dto/consultar-usuarios.dto';
import { UsuarioEntity } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Usada pelo engenheiro para escolher o analista de um ensaio (RF26). */
  async listar(
    consulta: ConsultarUsuariosDto,
  ): Promise<Paginado<UsuarioEntity>> {
    const { pagina, tamanho, perfil } = consulta;
    const where: Prisma.UsuarioWhereInput = perfil ? { perfil } : {};

    const [usuarios, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return paginar(
      usuarios.map((usuario) => new UsuarioEntity(usuario)),
      total,
      consulta,
    );
  }
}
