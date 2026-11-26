import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FiltroDeExcecoes } from './comum/filtros/http-exception.filter';

/**
 * Configuração global da aplicação. Fica separada do main.ts para que os
 * testes e2e montem a API exatamente igual à que roda de verdade.
 */
export function configurarApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new FiltroDeExcecoes());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
