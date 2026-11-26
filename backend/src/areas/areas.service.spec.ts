import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AreasService } from './areas.service';

function erroPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('erro simulado', {
    code,
    clientVersion: 'teste',
  });
}

const areaDoBanco = {
  id: 1,
  nome: 'Área Norte',
  localizacao: 'Talhão 3',
  hectares: new Prisma.Decimal('42.5'),
  tipoSolo: null,
  observacoes: null,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

describe('AreasService', () => {
  let service: AreasService;
  const prisma = {
    $transaction: jest.fn(),
    area: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [AreasService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = modulo.get(AreasService);
  });

  it('lista paginado e converte hectares para número', async () => {
    prisma.$transaction.mockResolvedValue([[areaDoBanco], 41]);

    const resultado = await service.listar({ pagina: 2, tamanho: 20 });

    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20, orderBy: { nome: 'asc' } }),
    );
    expect(resultado).toMatchObject({
      pagina: 2,
      tamanho: 20,
      total: 41,
      totalDePaginas: 3,
    });
    expect(resultado.dados[0].hectares).toBe(42.5);
  });

  it('lista vazia tem 1 página', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);

    const resultado = await service.listar({ pagina: 1, tamanho: 20 });

    expect(resultado.totalDePaginas).toBe(1);
  });

  it('busca inexistente dá 404', async () => {
    prisma.area.findUnique.mockResolvedValue(null);

    await expect(service.buscarPorId(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('nome duplicado (P2002) dá 409', async () => {
    prisma.area.create.mockRejectedValue(erroPrisma('P2002'));

    await expect(
      service.criar({ nome: 'Área Norte', localizacao: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('alterar inexistente (P2025) dá 404', async () => {
    prisma.area.update.mockRejectedValue(erroPrisma('P2025'));

    await expect(
      service.atualizar(99, { nome: 'Nova' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remover área com ensaios (P2003) dá 409', async () => {
    prisma.area.delete.mockRejectedValue(erroPrisma('P2003'));

    await expect(service.remover(1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('erro desconhecido é relançado sem tradução', async () => {
    const falha = new Error('conexão perdida');
    prisma.area.delete.mockRejectedValue(falha);

    await expect(service.remover(1)).rejects.toBe(falha);
  });
});
