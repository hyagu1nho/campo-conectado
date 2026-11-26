import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SaudeService } from './saude.service';

/**
 * Verificação de saúde da API.
 * Rota pública: serve para conferir se o serviço e o banco estão no ar.
 */
@Public()
@Controller('saude')
export class SaudeController {
  constructor(private readonly saudeService: SaudeService) {}

  @Get()
  verificar() {
    return this.saudeService.verificar();
  }
}
