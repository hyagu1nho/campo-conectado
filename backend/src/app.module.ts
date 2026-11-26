import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { AvaliacaoModule } from './avaliacao/avaliacao.module';
import { EnsaiosModule } from './ensaios/ensaios.module';
import { FalhasModule } from './falhas/falhas.module';
import { MaquinasModule } from './maquinas/maquinas.module';
import { MedicoesModule } from './medicoes/medicoes.module';
import { PrismaModule } from './prisma/prisma.module';
import { SaudeModule } from './saude/saude.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SaudeModule,
    AreasModule,
    UsuariosModule,
    MaquinasModule,
    EnsaiosModule,
    MedicoesModule,
    FalhasModule,
    AvaliacaoModule,
  ],
})
export class AppModule {}
