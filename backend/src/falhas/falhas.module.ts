import { Module } from '@nestjs/common';
import { FalhasController } from './falhas.controller';
import { FalhasService } from './falhas.service';

@Module({
  controllers: [FalhasController],
  providers: [FalhasService],
})
export class FalhasModule {}
