import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);

  // Só chamadas feitas pelo navegador passam por CORS. Server Components e
  // Server Actions do Next.js e o app nativo não passam; a lista (separada
  // por vírgula) cobre o app Flutter rodando no navegador em desenvolvimento.
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3001')
      .split(',')
      .map((origem) => origem.trim()),
  });

  // Documentação interativa em /docs e o JSON OpenAPI em /docs-json.
  const config = new DocumentBuilder()
    .setTitle('API do Campo Conectado')
    .setDescription('Gestão de ensaios de campo de máquinas agrícolas')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
