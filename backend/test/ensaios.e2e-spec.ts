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
 * Roda contra o banco de desenvolvimento, com o seed aplicado.
 * Os ensaios criados aqui têm objetivo de prefixo único e são apagados no fim.
 */
describe('Ensaios (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const tokens = { engenheiro: '', analista: '', analista2: '' };
  let base: { maquinaId: number; areaId: number; analistaId: number };
  const prefixo = `E2E-ensaios-${Date.now()}`;

  type Ensaio = {
    id: number;
    situacao: string;
    dataPrevista: string;
    analista: { id: number };
    enviadoEm: string | null;
    concluidoEm: string | null;
    devolucoes: { comentario: string; autor: { nome: string } }[];
  };

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
      patch: (url: string) =>
        servidor.patch(url).set('Authorization', autorizacao),
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
    return resposta.body as Ensaio;
  };

  it('engenheiro planeja e a data volta no formato AAAA-MM-DD', async () => {
    const ensaio = await planejar('planejado');
    expect(ensaio.situacao).toBe('PLANEJADO');
    expect(ensaio.dataPrevista).toBe('2026-12-10');
    expect(ensaio.analista.id).toBe(base.analistaId);
  });

  it('referências inválidas dão 400 com todos os erros', async () => {
    const engenheiro = await prisma.usuario.findUniqueOrThrow({
      where: { email: CREDENCIAIS.engenheiro.email },
    });
    const resposta = await como('engenheiro')
      .post('/ensaios')
      .send({
        ...base,
        maquinaId: 999999,
        analistaId: engenheiro.id,
        objetivo: `${prefixo} inválido`,
        dataPrevista: '2026-12-10',
      })
      .expect(400);
    expect((resposta.body as CorpoErro).detalhes).toEqual([
      'Máquina 999999 não encontrada',
      `Usuário ${engenheiro.id} não é um analista`,
    ]);
  });

  it('data em formato errado dá 400', async () => {
    await como('engenheiro')
      .post('/ensaios')
      .send({
        ...base,
        objetivo: `${prefixo} data`,
        dataPrevista: '10/12/2026',
      })
      .expect(400);
  });

  it('ciclo completo: iniciar, enviar, devolver, reenviar e concluir', async () => {
    const { id } = await planejar('ciclo');

    const naoIniciado = await como('analista')
      .post(`/ensaios/${id}/enviar`)
      .expect(409);
    expect((naoIniciado.body as CorpoErro).detalhes).toEqual([
      'Ensaio PLANEJADO não pode ser enviado; só EM_ANDAMENTO ou DEVOLVIDO',
    ]);

    await como('analista').post(`/ensaios/${id}/iniciar`).expect(200);
    await como('engenheiro')
      .patch(`/ensaios/${id}`)
      .send({ objetivo: `${prefixo} alterado` })
      .expect(409);

    const semMedicoes = await como('analista')
      .post(`/ensaios/${id}/enviar`)
      .expect(400);
    expect((semMedicoes.body as CorpoErro).detalhes).toHaveLength(4);
    await registrarMedicoesMinimas(app, tokens.analista, id);
    const prontas = await como('engenheiro')
      .get(`/ensaios/${id}/pendencias`)
      .expect(200);
    expect(prontas.body).toEqual({ pendencias: [] });

    const enviado = await como('analista')
      .post(`/ensaios/${id}/enviar`)
      .expect(200);
    expect((enviado.body as Ensaio).enviadoEm).not.toBeNull();

    await como('engenheiro')
      .post(`/ensaios/${id}/devolver`)
      .send({})
      .expect(400);
    const devolvido = await como('engenheiro')
      .post(`/ensaios/${id}/devolver`)
      .send({ comentario: 'Faltou a temperatura do hidráulico' })
      .expect(200);
    expect((devolvido.body as Ensaio).situacao).toBe('DEVOLVIDO');

    await como('analista').post(`/ensaios/${id}/enviar`).expect(200);
    const concluido = await como('engenheiro')
      .post(`/ensaios/${id}/concluir`)
      .expect(200);
    const ensaio = concluido.body as Ensaio;
    expect(ensaio.situacao).toBe('CONCLUIDO');
    expect(ensaio.concluidoEm).not.toBeNull();
    expect(ensaio.devolucoes).toHaveLength(1);
    expect(ensaio.devolucoes[0].comentario).toBe(
      'Faltou a temperatura do hidráulico',
    );

    await como('engenheiro')
      .post(`/ensaios/${id}/devolver`)
      .send({
        comentario: 'Tarde demais',
      })
      .expect(409);
  });

  it('analista vê só os próprios ensaios', async () => {
    const resposta = await como('analista').get('/ensaios').expect(200);
    const corpo = resposta.body as { dados: Ensaio[] };
    expect(corpo.dados.length).toBeGreaterThan(0);
    for (const ensaio of corpo.dados) {
      expect(ensaio.analista.id).toBe(base.analistaId);
    }

    const outro = await como('analista2')
      .get('/ensaios')
      .query({ analistaId: base.analistaId })
      .expect(200);
    for (const ensaio of (outro.body as { dados: Ensaio[] }).dados) {
      expect(ensaio.analista.id).not.toBe(base.analistaId);
    }
  });

  it('outro analista não abre nem inicia o ensaio (403)', async () => {
    const { id } = await planejar('alheio');
    await como('analista2').get(`/ensaios/${id}`).expect(403);
    await como('analista2').post(`/ensaios/${id}/iniciar`).expect(403);
  });

  it('cada perfil só faz as próprias ações (403)', async () => {
    const { id } = await planejar('perfis');
    await como('analista')
      .post('/ensaios')
      .send({ ...base, objetivo: `${prefixo} x`, dataPrevista: '2026-12-10' })
      .expect(403);
    await como('engenheiro').post(`/ensaios/${id}/iniciar`).expect(403);
    await como('analista').post(`/ensaios/${id}/concluir`).expect(403);
  });

  it('remove só ensaio PLANEJADO', async () => {
    const planejado = await planejar('remover');
    await como('engenheiro').delete(`/ensaios/${planejado.id}`).expect(204);
    await como('engenheiro').get(`/ensaios/${planejado.id}`).expect(404);

    const iniciado = await planejar('iniciado');
    await como('analista').post(`/ensaios/${iniciado.id}/iniciar`).expect(200);
    await como('engenheiro').delete(`/ensaios/${iniciado.id}`).expect(409);
  });
});
