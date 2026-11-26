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
 * Avaliação da Pulverização. Roda contra o banco de desenvolvimento com o
 * seed (pulverizador PV-0001: limite do motor 105 °C, do hidráulico 85 °C).
 * Os ensaios criados aqui têm objetivo de prefixo único e são apagados no fim.
 */
describe('Avaliação da Pulverização (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const tokens = { engenheiro: '', analista: '' };
  let base: { maquinaId: number; areaId: number; analistaId: number };
  let distribuidorId: number;
  const prefixo = `E2E-avaliacao-${Date.now()}`;

  type Avaliacao = {
    criterios: { criterio: string; parecer: string | null }[];
    evidencias: {
      temperaturaMotor: { maxima: number; limite: number; excedeu: boolean };
      falhasPorSeveridade: Record<string, number>;
      horasTrabalhadas: number | null;
      diferencaConcorrente: number | null;
    };
    pendencias: string[];
    progresso: { avaliados: number; total: number };
  };

  const CRITERIOS = [
    'ESTABILIDADE_BARRAS',
    'TEMPERATURA_MOTOR',
    'TEMPERATURA_HIDRAULICO',
    'DURABILIDADE',
    'EFICIENCIA_CONCORRENTE',
    'OPERACAO',
    'MANUTENCAO',
  ];
  const CAMPOS = {
    velocidade: 18,
    terreno: 'Ondulado',
    horimetroInicial: 100,
    horimetroFinal: 108.5,
    capacidadeOperacional: 32,
    capacidadeConcorrente: 30,
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

    const [pulverizador, distribuidor, area, analista] = await Promise.all([
      prisma.maquina.findUniqueOrThrow({ where: { numeroSerie: 'PV-0001' } }),
      prisma.maquina.findUniqueOrThrow({ where: { numeroSerie: 'DS-0001' } }),
      prisma.area.findUniqueOrThrow({ where: { nome: 'Área Norte' } }),
      prisma.usuario.findUniqueOrThrow({
        where: { email: CREDENCIAIS.analista.email },
      }),
    ]);
    distribuidorId = distribuidor.id;
    base = {
      maquinaId: pulverizador.id,
      areaId: area.id,
      analistaId: analista.id,
    };
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
      put: (url: string) => servidor.put(url).set('Authorization', autorizacao),
    };
  };

  const planejar = async (sufixo: string, maquinaId = base.maquinaId) => {
    const resposta = await como('engenheiro')
      .post('/ensaios')
      .send({
        ...base,
        maquinaId,
        objetivo: `${prefixo} ${sufixo}`,
        dataPrevista: '2026-12-10',
      })
      .expect(201);
    return (resposta.body as { id: number }).id;
  };

  const avaliarTodos = async (id: number, parecer = 'CONFORME') => {
    for (const criterio of CRITERIOS) {
      await como('analista')
        .put(`/ensaios/${id}/avaliacao/criterios/${criterio}`)
        .send({ parecer })
        .expect(200);
    }
  };

  it('vazia: lista os 7 critérios sem parecer e as pendências', async () => {
    const id = await planejar('vazia');
    const resposta = await como('analista')
      .get(`/ensaios/${id}/avaliacao`)
      .expect(200);
    const avaliacao = resposta.body as Avaliacao;
    expect(avaliacao.criterios).toHaveLength(7);
    expect(avaliacao.criterios.every((c) => c.parecer === null)).toBe(true);
    expect(avaliacao.pendencias).toEqual([
      'A avaliação da Pulverização não foi preenchida',
    ]);
  });

  it('evidências vêm das medições, das falhas e da ficha', async () => {
    const id = await planejar('evidencias');
    for (const valor of [98, 108.5]) {
      await como('analista')
        .post(`/ensaios/${id}/medicoes`)
        .send({ grandeza: 'TEMPERATURA_MOTOR', valor })
        .expect(201);
    }
    await como('analista')
      .post(`/ensaios/${id}/falhas`)
      .send({ descricao: 'Barra trincada', severidade: 'MAIOR' })
      .expect(201);
    const resposta = await como('analista')
      .patch(`/ensaios/${id}/avaliacao`)
      .send(CAMPOS)
      .expect(200);
    const { evidencias } = resposta.body as Avaliacao;
    expect(evidencias.temperaturaMotor).toEqual({
      maxima: 108.5,
      limite: 105,
      excedeu: true,
    });
    expect(evidencias.falhasPorSeveridade).toEqual({
      CRITICA: 0,
      MAIOR: 1,
      MENOR: 0,
    });
    expect(evidencias.horasTrabalhadas).toBe(8.5);
    expect(evidencias.diferencaConcorrente).toBe(6.7);
  });

  it('salva critério a critério e exige justificativa quando não conforme', async () => {
    const id = await planejar('criterios');
    const semJustificativa = await como('analista')
      .put(`/ensaios/${id}/avaliacao/criterios/DURABILIDADE`)
      .send({ parecer: 'NAO_CONFORME' })
      .expect(400);
    expect((semJustificativa.body as CorpoErro).detalhes).toEqual([
      'Durabilidade das peças: parecer NAO_CONFORME exige justificativa',
    ]);

    const salvo = await como('analista')
      .put(`/ensaios/${id}/avaliacao/criterios/DURABILIDADE`)
      .send({ parecer: 'CONFORME' })
      .expect(200);
    expect((salvo.body as Avaliacao).progresso).toEqual({
      avaliados: 1,
      total: 7,
    });

    await como('analista')
      .put(`/ensaios/${id}/avaliacao/criterios/RUIDO`)
      .send({ parecer: 'CONFORME' })
      .expect(400);
  });

  it('horímetro final menor que o inicial dá 400', async () => {
    const id = await planejar('horimetro');
    await como('analista')
      .patch(`/ensaios/${id}/avaliacao`)
      .send({ horimetroInicial: 100 })
      .expect(200);
    await como('analista')
      .patch(`/ensaios/${id}/avaliacao`)
      .send({ horimetroFinal: 90 })
      .expect(400);
  });

  it('envio bloqueado por incoerência e liberado depois de corrigir', async () => {
    const id = await planejar('envio');
    await como('analista')
      .post(`/ensaios/${id}/falhas`)
      .send({ descricao: 'Quebra do eixo', severidade: 'CRITICA' })
      .expect(201);
    await registrarMedicoesMinimas(app, tokens.analista, id);
    await avaliarTodos(id);
    await como('analista')
      .patch(`/ensaios/${id}/avaliacao`)
      .send({ ...CAMPOS, parecerFinal: 'APROVADA' })
      .expect(200);

    const bloqueado = await como('analista')
      .post(`/ensaios/${id}/enviar`)
      .expect(400);
    expect((bloqueado.body as CorpoErro).detalhes).toEqual([
      'Com falha crítica registrada, a durabilidade das peças não pode ser CONFORME',
      'Com falha crítica ou critério NAO_CONFORME, o parecer final não pode ser APROVADA',
    ]);

    await como('analista')
      .put(`/ensaios/${id}/avaliacao/criterios/DURABILIDADE`)
      .send({ parecer: 'NAO_CONFORME', justificativa: 'Eixo quebrou' })
      .expect(200);
    await como('analista')
      .patch(`/ensaios/${id}/avaliacao`)
      .send({ parecerFinal: 'REPROVADA', justificativaFinal: 'Falha crítica' })
      .expect(200);
    await como('analista').post(`/ensaios/${id}/enviar`).expect(200);

    await como('analista')
      .put(`/ensaios/${id}/avaliacao/criterios/OPERACAO`)
      .send({ parecer: 'CONFORME' })
      .expect(409);
  });

  it('ensaio de outra linha não tem avaliação, e envia sem ela', async () => {
    const id = await planejar('distribuidor', distribuidorId);
    await como('engenheiro').get(`/ensaios/${id}/avaliacao`).expect(400);
    await como('analista')
      .put(`/ensaios/${id}/avaliacao/criterios/OPERACAO`)
      .send({ parecer: 'CONFORME' })
      .expect(400);
    await registrarMedicoesMinimas(app, tokens.analista, id);
    await como('analista').post(`/ensaios/${id}/enviar`).expect(200);
  });

  it('engenheiro lê mas não preenche (403)', async () => {
    const id = await planejar('perfil');
    await como('engenheiro').get(`/ensaios/${id}/avaliacao`).expect(200);
    await como('engenheiro')
      .patch(`/ensaios/${id}/avaliacao`)
      .send(CAMPOS)
      .expect(403);
  });
});
