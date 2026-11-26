import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';
import { CorpoErro } from './tipos';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduloTeste: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduloTeste.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  it('GET /saude responde 200 com API e banco no ar', () => {
    return request(app.getHttpServer())
      .get('/saude')
      .expect(200)
      .expect({ status: 'ok', banco: 'ok' });
  });

  it('rota inexistente responde 404 no formato padrão de erro', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/nao-existe')
      .expect(404);

    expect(resposta.body).toMatchObject({
      status: 404,
      titulo: 'NOT_FOUND',
      caminho: '/nao-existe',
    });
    expect(Array.isArray((resposta.body as CorpoErro).detalhes)).toBe(true);
  });

  afterEach(async () => {
    await app.close();
  });
});
