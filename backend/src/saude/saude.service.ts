import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaudeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Confere se a API alcanca o banco; sem banco, responde 503. */
  async verificar() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
    return { status: 'ok', banco: 'ok' };
  }
}
