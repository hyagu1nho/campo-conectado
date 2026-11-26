import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';
import { CorpoErro, CREDENCIAIS, obterToken } from './tipos';

/** Roda contra o banco de desenvolvimento, com o seed aplicado. */
describe('Autenticação e autorização (e2e)', () => {
  let app: INestApplication<App>;
  let tokenEngenheiro: string;
  let tokenAnalista: string;

  beforeAll(async () => {
    const moduloTeste: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduloTeste.createNestApplication();
    configurarApp(app);
    await app.init();
    tokenEngenheiro = await obterToken(app, 'engenheiro');
    tokenAnalista = await obterToken(app, 'analista');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('login correto devolve accessToken', async () => {
    const resposta = await http()
      .post('/auth/login')
      .send(CREDENCIAIS.engenheiro)
      .expect(200);
    const corpo = resposta.body as Record<string, unknown>;
    expect(Object.keys(corpo)).toEqual(['accessToken']);
    expect(typeof corpo.accessToken).toBe('string');
  });

  it('login com senha errada e com e-mail inexistente dão o mesmo 401', async () => {
    const senhaErrada = await http()
      .post('/auth/login')
      .send({ email: CREDENCIAIS.engenheiro.email, senha: 'errada' })
      .expect(401);
    const emailInexistente = await http()
      .post('/auth/login')
      .send({ email: 'ninguem@campo.dev', senha: 'qualquer' })
      .expect(401);
    expect((senhaErrada.body as CorpoErro).detalhes).toEqual(
      (emailInexistente.body as CorpoErro).detalhes,
    );
  });

  it('login com corpo inválido dá 400', () => {
    return http().post('/auth/login').send({ email: 'x' }).expect(400);
  });

  it('GET /auth/perfil devolve id, nome, e-mail e perfil', async () => {
    const resposta = await http()
      .get('/auth/perfil')
      .set('Authorization', `Bearer ${tokenAnalista}`)
      .expect(200);
    const corpo = resposta.body as Record<string, unknown>;
    expect(Object.keys(corpo).sort()).toEqual([
      'email',
      'id',
      'nome',
      'perfil',
    ]);
    expect(typeof corpo.id).toBe('number');
    expect(corpo.email).toBe('analista@campo.dev');
    expect(corpo.perfil).toBe('ANALISTA');
  });

  it('sem token ou com token adulterado dá 401', async () => {
    await http().get('/auth/perfil').expect(401);
    await http()
      .get('/auth/perfil')
      .set('Authorization', `Bearer ${tokenAnalista}x`)
      .expect(401);
  });

  it('/saude continua pública', () => {
    return http().get('/saude').expect(200);
  });

  it('analista não acessa áreas nem usuários (403)', async () => {
    await http()
      .get('/areas')
      .set('Authorization', `Bearer ${tokenAnalista}`)
      .expect(403);
    await http()
      .get('/usuarios')
      .set('Authorization', `Bearer ${tokenAnalista}`)
      .expect(403);
  });

  it('engenheiro lista só analistas, sem senha na resposta', async () => {
    const resposta = await http()
      .get('/usuarios')
      .query({ perfil: 'ANALISTA' })
      .set('Authorization', `Bearer ${tokenEngenheiro}`)
      .expect(200);
    const { dados } = resposta.body as {
      dados: Record<string, unknown>[];
    };
    expect(dados.length).toBeGreaterThan(0);
    for (const usuario of dados) {
      expect(usuario.perfil).toBe('ANALISTA');
      expect(usuario).not.toHaveProperty('senhaHash');
    }
  });

  it('perfil inválido no filtro dá 400', () => {
    return http()
      .get('/usuarios')
      .query({ perfil: 'ADMIN' })
      .set('Authorization', `Bearer ${tokenEngenheiro}`)
      .expect(400);
  });
});
