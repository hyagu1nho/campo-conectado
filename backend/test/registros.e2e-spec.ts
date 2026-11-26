import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/configurar-app';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  CorpoErro,
  CREDENCIAIS,
  obterToken,
  registrarMedicoesMinimas,
} from './tipos';

/**
 * Medições e falhas. Roda contra o banco de desenvolvimento com o seed;
 * os ensaios criados aqui têm objetivo de prefixo único e são apagados no fim
 * (medições e falhas vão junto, em cascata).
 */
describe('Medições e falhas (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const tokens = { engenheiro: '', analista: '', analista2: '' };
  let base: { maquinaId: number; areaId: number; analistaId: number };
  const prefixo = `E2E-registros-${Date.now()}`;

  type Pagina<T> = { dados: T[]; total: number };
  type Medicao = { id: number; valor: number; horimetro: number | null };
  type Falha = { id: number; severidade: string };

  beforeAll(async () => {
    const moduloTeste: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduloTeste.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    tokens.engenheiro = await obterToken(app, 'engenheiro');
    tokens.analista = await obterToken(app, 'analista');
    tokens.analista2 = await obterToken(app, 'analista2');

    const [maquina, area, analista] = await Promise.all([
      prisma.maquina.findUniqueOrThrow({ where: { numeroSerie: 'DS-0001' } }),
      prisma.area.findUniqueOrThrow({ where: { nome: 'Área Norte' } }),
      prisma.usuario.findUniqueOrThrow({
        where: { email: CREDENCIAIS.analista.email },
      }),
    ]);
    base = { maquinaId: maquina.id, areaId: area.id, analistaId: analista.id };
  });

  afterAll(async () => {
    await prisma.ensaio.deleteMany({
      where: { objetivo: { startsWith: prefixo } },
    });
    await app.close();
  });

  const como = (quem: keyof typeof tokens) => {
    const servidor = request(app.getHttpServer());
    const autorizacao = `Bearer ${tokens[quem]}`;
    return {
      get: (url: string) => servidor.get(url).set('Authorization', autorizacao),
      post: (url: string) =>
        servidor.post(url).set('Authorization', autorizacao),
      delete: (url: string) =>
        servidor.delete(url).set('Authorization', autorizacao),
    };
  };

  const planejar = async (sufixo: string) => {
    const resposta = await como('engenheiro')
      .post('/ensaios')
      .send({
        ...base,
        objetivo: `${prefixo} ${sufixo}`,
        dataPrevista: '2026-12-10',
      })
      .expect(201);
    return (resposta.body as { id: number }).id;
  };

  const situacao = async (id: number) =>
    (await prisma.ensaio.findUniqueOrThrow({ where: { id } })).situacao;

  const MEDICAO = {
    grandeza: 'TEMPERATURA_MOTOR',
    valor: 92.125,
    horimetro: 1520.4,
  };

  it('primeiro registro inicia o ensaio PLANEJADO', async () => {
    const id = await planejar('inicia');
    const resposta = await como('analista')
      .post(`/ensaios/${id}/medicoes`)
      .send(MEDICAO)
      .expect(201);
    expect(resposta.body as Medicao).toMatchObject({
      valor: 92.125,
      horimetro: 1520.4,
    });
    expect(await situacao(id)).toBe('EM_ANDAMENTO');
  });

  it('medição inválida dá 400 com todos os erros', async () => {
    const id = await planejar('invalida');
    const resposta = await como('analista')
      .post(`/ensaios/${id}/medicoes`)
      .send({
        grandeza: 'PRESSAO',
        valor: 1.2345,
        registradaEm: '2099-01-01T00:00:00Z',
      })
      .expect(400);
    expect((resposta.body as CorpoErro).detalhes).toHaveLength(3);
    expect(await situacao(id)).toBe('PLANEJADO');
  });

  it('falhas são registradas e filtradas por severidade', async () => {
    const id = await planejar('falhas');
    for (const severidade of ['CRITICA', 'MENOR', 'MENOR']) {
      await como('analista')
        .post(`/ensaios/${id}/falhas`)
        .send({ descricao: `Falha ${severidade}`, severidade })
        .expect(201);
    }
    const resposta = await como('engenheiro')
      .get(`/ensaios/${id}/falhas`)
      .query({ severidade: 'MENOR' })
      .expect(200);
    const corpo = resposta.body as Pagina<Falha>;
    expect(corpo.total).toBe(2);
    expect(corpo.dados.every((f) => f.severidade === 'MENOR')).toBe(true);
  });

  it('engenheiro lê mas não registra; outro analista nem lê (403)', async () => {
    const id = await planejar('acesso');
    await como('engenheiro').get(`/ensaios/${id}/medicoes`).expect(200);
    await como('engenheiro')
      .post(`/ensaios/${id}/medicoes`)
      .send(MEDICAO)
      .expect(403);
    await como('analista2').get(`/ensaios/${id}/medicoes`).expect(403);
    await como('analista2')
      .post(`/ensaios/${id}/falhas`)
      .send({ descricao: 'x', severidade: 'MENOR' })
      .expect(403);
  });

  it('ensaio enviado não aceita registros; devolvido volta a aceitar', async () => {
    const id = await planejar('enviado');
    const criada = await como('analista')
      .post(`/ensaios/${id}/medicoes`)
      .send(MEDICAO)
      .expect(201);
    const medicaoId = (criada.body as Medicao).id;
    await registrarMedicoesMinimas(app, tokens.analista, id);
    await como('analista').post(`/ensaios/${id}/enviar`).expect(200);

    const bloqueado = await como('analista')
      .post(`/ensaios/${id}/medicoes`)
      .send(MEDICAO)
      .expect(409);
    expect((bloqueado.body as CorpoErro).detalhes).toEqual([
      'Ensaio ENVIADO não aceita registros; só PLANEJADO, EM_ANDAMENTO ou DEVOLVIDO',
    ]);
    await como('analista')
      .delete(`/ensaios/${id}/medicoes/${medicaoId}`)
      .expect(409);

    await como('engenheiro')
      .post(`/ensaios/${id}/devolver`)
      .send({ comentario: 'Refazer a medição' })
      .expect(200);
    await como('analista')
      .delete(`/ensaios/${id}/medicoes/${medicaoId}`)
      .expect(204);
    await como('analista')
      .post(`/ensaios/${id}/medicoes`)
      .send(MEDICAO)
      .expect(201);
    expect(await situacao(id)).toBe('DEVOLVIDO');
  });

  it('remover medição de outro ensaio dá 404', async () => {
    const id1 = await planejar('dono');
    const id2 = await planejar('intruso');
    const criada = await como('analista')
      .post(`/ensaios/${id1}/medicoes`)
      .send(MEDICAO)
      .expect(201);
    await como('analista')
      .delete(`/ensaios/${id2}/medicoes/${(criada.body as Medicao).id}`)
      .expect(404);
  });

  it('ensaio inexistente dá 404', async () => {
    await como('engenheiro').get('/ensaios/999999/falhas').expect(404);
  });
});
