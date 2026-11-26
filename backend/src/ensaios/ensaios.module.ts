import { Module } from '@nestjs/common';
import { EnsaiosController } from './ensaios.controller';
import { EnsaiosService } from './ensaios.service';

@Module({
  controllers: [EnsaiosController],
  providers: [EnsaiosService],
})
export class EnsaiosModule {}
