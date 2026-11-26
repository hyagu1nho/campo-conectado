import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SaudeService } from './saude.service';

describe('SaudeService', () => {
  let service: SaudeService;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [SaudeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = modulo.get(SaudeService);
  });

  it('informa ok quando o banco responde', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.verificar()).resolves.toEqual({
      status: 'ok',
      banco: 'ok',
    });
  });

  it('lança 503 quando o banco não responde', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('conexão recusada'));

    await expect(service.verificar()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
