import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginar, Paginado } from '../comum/dto/consultar-paginado.dto';
import { Linha, Prisma, TipoMaquina } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampoAdicionalDto } from './dto/campo-adicional.dto';
import { AtualizarMaquinaDto } from './dto/atualizar-maquina.dto';
import { ConsultarMaquinasDto } from './dto/consultar-maquinas.dto';
import { CriarMaquinaDto } from './dto/criar-maquina.dto';
import {
  tipoPermitido,
  tiposDaLinha,
  validarFicha,
  ValorValidado,
} from './ficha';
import {
  FormularioLinhaEntity,
  MaquinaEntity,
  MaquinaResumoEntity,
} from './maquina.entity';

/** Relações carregadas para montar o detalhe da máquina. */
const COM_FICHA = {
  valores: { include: { campoModelo: true } },
  camposAdicionais: { orderBy: { nome: 'asc' } },
} satisfies Prisma.MaquinaInclude;

type ClienteTransacao = Prisma.TransactionClient;

@Injectable()
export class MaquinasService {
  constructor(private readonly prisma: PrismaService) {}

  async formularioDaLinha(linha: Linha): Promise<FormularioLinhaEntity> {
    const campos = await this.prisma.campoModelo.findMany({
      where: { linha },
      orderBy: { ordem: 'asc' },
    });
    return new FormularioLinhaEntity(linha, campos);
  }

  async listar(
    consulta: ConsultarMaquinasDto,
  ): Promise<Paginado<MaquinaResumoEntity>> {
    const { pagina, tamanho, linha, busca } = consulta;
    const where: Prisma.MaquinaWhereInput = {
      ...(linha && { linha }),
      ...(busca && {
        OR: [
          { modelo: { contains: busca, mode: 'insensitive' } },
          { numeroSerie: { contains: busca, mode: 'insensitive' } },
        ],
      }),
    };

    const [maquinas, total] = await this.prisma.$transaction([
      this.prisma.maquina.findMany({
        where,
        orderBy: { modelo: 'asc' },
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.maquina.count({ where }),
    ]);

    return paginar(
      maquinas.map((maquina) => new MaquinaResumoEntity(maquina)),
      total,
      consulta,
    );
  }

  async buscarPorId(id: number): Promise<MaquinaEntity> {
    const maquina = await this.prisma.maquina.findUnique({
      where: { id },
      include: COM_FICHA,
    });
    if (!maquina) throw new NotFoundException(`Máquina ${id} não encontrada`);
    return new MaquinaEntity(maquina);
  }

  async criar(dto: CriarMaquinaDto): Promise<MaquinaEntity> {
    this.garantirTipo(dto.linha, dto.tipo);
    const adicionais = this.conferirAdicionais(dto.camposAdicionais ?? []);
    const valores = await this.conferirFicha(this.prisma, dto.linha, dto.ficha);

    try {
      const maquina = await this.prisma.maquina.create({
        data: {
          modelo: dto.modelo,
          numeroSerie: dto.numeroSerie,
          linha: dto.linha,
          tipo: dto.tipo,
          valores: { create: valores },
          camposAdicionais: { create: adicionais },
        },
        include: COM_FICHA,
      });
      return new MaquinaEntity(maquina);
    } catch (erro) {
      this.traduzirErro(erro, { numeroSerie: dto.numeroSerie });
    }
  }

  /**
   * Tudo numa transação interativa: ou a máquina, a ficha e os campos
   * adicionais mudam juntos, ou nada muda.
   */
  async atualizar(
    id: number,
    dto: AtualizarMaquinaDto,
  ): Promise<MaquinaEntity> {
    try {
      const maquina = await this.prisma.$transaction(async (tx) => {
        const atual = await tx.maquina.findUnique({
          where: { id },
          include: { _count: { select: { ensaios: true } } },
        });
        if (!atual) throw new NotFoundException(`Máquina ${id} não encontrada`);

        const linha = dto.linha ?? atual.linha;
        this.garantirTipo(linha, dto.tipo ?? atual.tipo);

        if (linha !== atual.linha) {
          if (atual._count.ensaios > 0) {
            throw new ConflictException(
              `Máquina ${id} possui ensaios e não pode trocar de linha`,
            );
          }
          if (!dto.ficha) {
            throw new BadRequestException(
              'Ao trocar de linha, envie a ficha completa da nova linha',
            );
          }
        }

        const adicionais =
          dto.camposAdicionais && this.conferirAdicionais(dto.camposAdicionais);
        const valores =
          dto.ficha && (await this.conferirFicha(tx, linha, dto.ficha));

        if (valores) {
          await tx.valorCampo.deleteMany({ where: { maquinaId: id } });
        }
        if (adicionais) {
          await tx.campoAdicional.deleteMany({ where: { maquinaId: id } });
        }

        return tx.maquina.update({
          where: { id },
          data: {
            modelo: dto.modelo,
            numeroSerie: dto.numeroSerie,
            linha: dto.linha,
            tipo: dto.tipo,
            ...(valores && { valores: { create: valores } }),
            ...(adicionais && { camposAdicionais: { create: adicionais } }),
          },
          include: COM_FICHA,
        });
      });
      return new MaquinaEntity(maquina);
    } catch (erro) {
      this.traduzirErro(erro, { id, numeroSerie: dto.numeroSerie });
    }
  }

  async remover(id: number): Promise<void> {
    try {
      await this.prisma.maquina.delete({ where: { id } });
    } catch (erro) {
      this.traduzirErro(erro, { id });
    }
  }

  private garantirTipo(linha: Linha, tipo: TipoMaquina) {
    if (!tipoPermitido(linha, tipo)) {
      throw new BadRequestException(
        `Máquina da linha ${linha} deve ser do tipo ${tiposDaLinha(linha).join(' ou ')}`,
      );
    }
  }

  private async conferirFicha(
    cliente: ClienteTransacao | PrismaService,
    linha: Linha,
    ficha: Record<string, unknown>,
  ): Promise<ValorValidado[]> {
    const campos = await cliente.campoModelo.findMany({ where: { linha } });
    const { valores, erros } = validarFicha(campos, ficha);
    if (erros.length > 0) throw new BadRequestException(erros);
    return valores;
  }

  private conferirAdicionais(adicionais: CampoAdicionalDto[]) {
    const nomes = adicionais.map((campo) => campo.nome.trim().toLowerCase());
    if (new Set(nomes).size !== nomes.length) {
      throw new BadRequestException(
        'Os campos adicionais não podem ter nomes repetidos',
      );
    }
    return adicionais.map(({ nome, valor, unidade }) => ({
      nome: nome.trim(),
      valor,
      unidade: unidade ?? null,
    }));
  }

  /** Erros conhecidos do Prisma viram HTTP; a mensagem do Prisma nunca vaza. */
  private traduzirErro(
    erro: unknown,
    contexto: { id?: number; numeroSerie?: string },
  ): never {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      switch (erro.code) {
        case 'P2002':
          throw new ConflictException(
            `Já existe uma máquina com o número de série ${contexto.numeroSerie}`,
          );
        case 'P2025':
          throw new NotFoundException(`Máquina ${contexto.id} não encontrada`);
        case 'P2003':
          throw new ConflictException(
            `Máquina ${contexto.id} possui ensaios e não pode ser removida`,
          );
      }
    }
    throw erro;
  }
}
