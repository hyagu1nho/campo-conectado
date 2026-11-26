import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';
import { PrismaService } from './../src/prisma/prisma.service';
import { CorpoErro, obterToken } from './tipos';

/**
 * Roda contra o banco de desenvolvimento (precisa do seed aplicado).
 * Cria as próprias áreas com um prefixo único e apaga tudo no fim.
 */
describe('Áreas (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  const prefixo = `e2e-${Date.now()}`;

  beforeAll(async () => {
    const moduloTeste: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduloTeste.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    token = await obterToken(app, 'engenheiro');
  });

  afterAll(async () => {
    await prisma.area.deleteMany({ where: { nome: { startsWith: prefixo } } });
    await app.close();
  });

  // Todas as chamadas deste arquivo vão como o engenheiro do seed.
  const http = () => {
    const servidor = request(app.getHttpServer());
    const autorizacao = `Bearer ${token}`;
    return {
      get: (url: string) => servidor.get(url).set('Authorization', autorizacao),
      post: (url: string) =>
        servidor.post(url).set('Authorization', autorizacao),
      patch: (url: string) =>
        servidor.patch(url).set('Authorization', autorizacao),
      delete: (url: string) =>
        servidor.delete(url).set('Authorization', autorizacao),
    };
  };

  it('sem token dá 401', () => {
    return request(app.getHttpServer()).get('/areas').expect(401);
  });

  it('ciclo completo: cria, busca, altera, lista e remove', async () => {
    const criada = await http()
      .post('/areas')
      .send({ nome: `${prefixo} A`, localizacao: 'Talhão 1', hectares: 10.25 })
      .expect(201);
    expect(criada.body).toMatchObject({
      nome: `${prefixo} A`,
      hectares: 10.25,
    });
    const { id } = criada.body as { id: number };

    await http().get(`/areas/${id}`).expect(200);

    const alterada = await http()
      .patch(`/areas/${id}`)
      .send({ tipoSolo: 'Argiloso', hectares: null })
      .expect(200);
    expect(alterada.body).toMatchObject({
      tipoSolo: 'Argiloso',
      hectares: null,
    });

    const lista = await http()
      .get('/areas')
      .query({ nome: prefixo, tamanho: 5 })
      .expect(200);
    expect(lista.body).toMatchObject({
      pagina: 1,
      tamanho: 5,
      total: 1,
      totalDePaginas: 1,
    });

    await http().delete(`/areas/${id}`).expect(204);
    await http().get(`/areas/${id}`).expect(404);
  });

  it('valida a entrada e lista todos os erros de uma vez', async () => {
    const resposta = await http()
      .post('/areas')
      .send({ nome: '', hectares: -1, admin: true })
      .expect(400);

    const corpo = resposta.body as CorpoErro;
    expect(corpo.titulo).toBe('BAD_REQUEST');
    expect(corpo.detalhes).toEqual(
      expect.arrayContaining([
        'o nome é obrigatório',
        'a localização é obrigatória',
        'hectares deve ser maior que zero',
        'property admin should not exist',
      ]),
    );
  });

  it('PATCH com nome null dá 400', () => {
    return http().patch('/areas/1').send({ nome: null }).expect(400);
  });

  it('nome duplicado dá 409', async () => {
    const corpo = { nome: `${prefixo} B`, localizacao: 'Talhão 2' };
    await http().post('/areas').send(corpo).expect(201);
    await http().post('/areas').send(corpo).expect(409);
  });

  it('não remove área com ensaios vinculados (409)', async () => {
    const comEnsaio = await prisma.area.findFirstOrThrow({
      where: { ensaios: { some: {} } },
    });
    await http().delete(`/areas/${comEnsaio.id}`).expect(409);
  });

  it('id não numérico dá 400 e tamanho acima de 100 dá 400', async () => {
    await http().get('/areas/abc').expect(400);
    await http().get('/areas').query({ tamanho: 101 }).expect(400);
  });
});
