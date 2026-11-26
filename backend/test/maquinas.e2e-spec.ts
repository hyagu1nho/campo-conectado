import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';
import { PrismaService } from './../src/prisma/prisma.service';
import { CorpoErro, obterToken } from './tipos';

/**
 * Roda contra o banco de desenvolvimento, com o seed aplicado.
 * Cria máquinas com número de série de prefixo único e apaga no fim.
 */
describe('Máquinas (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  const prefixo = `E2E-maquinas-${Date.now()}`;

  const FICHA_PULVERIZADOR = {
    capacidadeTanque: 3000,
    comprimentoBarras: 36,
    espacamentoBicos: 50,
    potenciaMotor: 250,
    limiteTemperaturaMotor: 105,
    limiteTemperaturaHidraulico: 85,
  };
  const FICHA_PLANTADEIRA = {
    numeroLinhas: 20,
    espacamentoLinhas: 45,
    sistemaDosador: 'Mecânico',
  };

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
    await prisma.maquina.deleteMany({
      where: { numeroSerie: { startsWith: prefixo } },
    });
    await app.close();
  });

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

  type Maquina = {
    id: number;
    linha: string;
    ficha: { chave: string; valor: unknown }[];
    camposAdicionais: { nome: string }[];
  };

  it('GET /campos-modelo devolve tipos e campos da linha', async () => {
    const resposta = await http()
      .get('/campos-modelo')
      .query({ linha: 'PULVERIZACAO' })
      .expect(200);
    const corpo = resposta.body as { tipos: string[]; campos: unknown[] };
    expect(corpo.tipos).toEqual(['AUTOPROPELIDO']);
    expect(corpo.campos).toHaveLength(6);
  });

  it('cria com ficha válida e devolve a ficha tipada e ordenada', async () => {
    const resposta = await http()
      .post('/maquinas')
      .send({
        modelo: 'Pulverizador teste',
        numeroSerie: `${prefixo}-1`,
        linha: 'PULVERIZACAO',
        tipo: 'AUTOPROPELIDO',
        ficha: FICHA_PULVERIZADOR,
        camposAdicionais: [{ nome: 'Cor', valor: 'Laranja' }],
      })
      .expect(201);
    const maquina = resposta.body as Maquina;
    expect(maquina.ficha[0]).toMatchObject({
      chave: 'capacidadeTanque',
      valor: 3000,
    });
    expect(maquina.camposAdicionais).toHaveLength(1);
  });

  it('ficha inválida dá 400 com todos os erros', async () => {
    const resposta = await http()
      .post('/maquinas')
      .send({
        modelo: 'Inválida',
        numeroSerie: `${prefixo}-2`,
        linha: 'PULVERIZACAO',
        tipo: 'AUTOPROPELIDO',
        ficha: { ...FICHA_PULVERIZADOR, capacidadeTanque: 10, cor: 'azul' },
      })
      .expect(400);
    expect((resposta.body as CorpoErro).detalhes).toEqual([
      'cor não é um campo da ficha desta linha',
      'Capacidade do tanque deve estar entre 600 e 6000',
    ]);
  });

  it('tipo incompatível com a linha dá 400', async () => {
    const resposta = await http()
      .post('/maquinas')
      .send({
        modelo: 'Pulverizador de arrasto',
        numeroSerie: `${prefixo}-3`,
        linha: 'PULVERIZACAO',
        tipo: 'ARRASTO',
        ficha: FICHA_PULVERIZADOR,
      })
      .expect(400);
    expect((resposta.body as CorpoErro).detalhes).toEqual([
      'Máquina da linha PULVERIZACAO deve ser do tipo AUTOPROPELIDO',
    ]);
  });

  it('número de série repetido dá 409', async () => {
    await http()
      .post('/maquinas')
      .send({
        modelo: 'Repetida',
        numeroSerie: `${prefixo}-1`,
        linha: 'PULVERIZACAO',
        tipo: 'AUTOPROPELIDO',
        ficha: FICHA_PULVERIZADOR,
      })
      .expect(409);
  });

  it('mais de 20 campos adicionais ou nomes repetidos dão 400', async () => {
    const base = {
      modelo: 'Adicionais',
      numeroSerie: `${prefixo}-4`,
      linha: 'PLANTIO',
      tipo: 'ARRASTO',
      ficha: FICHA_PLANTADEIRA,
    };
    const vinteEUm = Array.from({ length: 21 }, (_, i) => ({
      nome: `Campo ${i}`,
      valor: 'x',
    }));
    await http()
      .post('/maquinas')
      .send({ ...base, camposAdicionais: vinteEUm })
      .expect(400);
    await http()
      .post('/maquinas')
      .send({
        ...base,
        camposAdicionais: [
          { nome: 'Cor', valor: 'a' },
          { nome: 'cor', valor: 'b' },
        ],
      })
      .expect(400);
  });

  it('troca de linha sem ensaios: exige a ficha nova e aceita', async () => {
    const criada = await http()
      .post('/maquinas')
      .send({
        modelo: 'Muda de linha',
        numeroSerie: `${prefixo}-5`,
        linha: 'PLANTIO',
        tipo: 'ARRASTO',
        ficha: FICHA_PLANTADEIRA,
      })
      .expect(201);
    const { id } = criada.body as Maquina;

    await http()
      .patch(`/maquinas/${id}`)
      .send({ linha: 'PULVERIZACAO', tipo: 'AUTOPROPELIDO' })
      .expect(400);

    const alterada = await http()
      .patch(`/maquinas/${id}`)
      .send({
        linha: 'PULVERIZACAO',
        tipo: 'AUTOPROPELIDO',
        ficha: FICHA_PULVERIZADOR,
      })
      .expect(200);
    const maquina = alterada.body as Maquina;
    expect(maquina.linha).toBe('PULVERIZACAO');
    expect(maquina.ficha.map((item) => item.chave)).toContain(
      'limiteTemperaturaMotor',
    );
  });

  it('máquina com ensaios não troca de linha nem é removida (409)', async () => {
    const comEnsaio = await prisma.maquina.findFirstOrThrow({
      where: { ensaios: { some: {} }, linha: 'PULVERIZACAO' },
    });
    await http()
      .patch(`/maquinas/${comEnsaio.id}`)
      .send({ linha: 'PLANTIO', tipo: 'ARRASTO', ficha: FICHA_PLANTADEIRA })
      .expect(409);
    await http().delete(`/maquinas/${comEnsaio.id}`).expect(409);
  });

  it('lista com filtro de linha e busca, sem a ficha', async () => {
    const resposta = await http()
      .get('/maquinas')
      .query({ linha: 'PULVERIZACAO', busca: prefixo })
      .expect(200);
    const corpo = resposta.body as { dados: Record<string, unknown>[] };
    expect(corpo.dados.length).toBeGreaterThan(0);
    for (const maquina of corpo.dados) {
      expect(maquina.linha).toBe('PULVERIZACAO');
      expect(maquina).not.toHaveProperty('ficha');
    }
  });

  it('analista não acessa máquinas (403)', async () => {
    const tokenAnalista = await obterToken(app, 'analista');
    await request(app.getHttpServer())
      .get('/maquinas')
      .set('Authorization', `Bearer ${tokenAnalista}`)
      .expect(403);
  });
});
