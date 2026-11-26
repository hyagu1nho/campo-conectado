import { Module } from '@nestjs/common';
import { CamposModeloController } from './campos-modelo.controller';
import { MaquinasController } from './maquinas.controller';
import { MaquinasService } from './maquinas.service';

@Module({
  controllers: [MaquinasController, CamposModeloController],
  providers: [MaquinasService],
})
export class MaquinasModule {}
