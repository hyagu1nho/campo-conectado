import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global de proposito: o acesso ao banco e infraestrutura usada por todos os
 * modulos de dominio, que assim nao precisam importar o PrismaModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
