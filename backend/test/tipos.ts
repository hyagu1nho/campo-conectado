import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

/** Corpo padrão de erro da API, para tipar respostas nos testes e2e. */
export interface CorpoErro {
  status: number;
  titulo: string;
  detalhes: string[];
  caminho: string;
  momento: string;
}

/** Usuários de teste criados pelo seed (prisma/seed.ts). */
export const CREDENCIAIS = {
  engenheiro: { email: 'engenheiro@campo.dev', senha: 'engenheiro123' },
  analista: { email: 'analista@campo.dev', senha: 'analista123' },
  analista2: { email: 'analista2@campo.dev', senha: 'analista123' },
};

/** Faz login de verdade na API e devolve o token. */
export async function obterToken(
  app: INestApplication<App>,
  quem: keyof typeof CREDENCIAIS,
): Promise<string> {
  const resposta = await request(app.getHttpServer())
    .post('/auth/login')
    .send(CREDENCIAIS[quem])
    .expect(200);
  return (resposta.body as { accessToken: string }).accessToken;
}

/** Uma medição de cada grandeza: o mínimo para enviar e concluir. */
export async function registrarMedicoesMinimas(
  app: INestApplication<App>,
  token: string,
  ensaioId: number,
): Promise<void> {
  const grandezas = [
    'TEMPERATURA_MOTOR',
    'TEMPERATURA_HIDRAULICO',
    'VELOCIDADE',
    'CONSUMO_COMBUSTIVEL',
  ];
  for (const grandeza of grandezas) {
    await request(app.getHttpServer())
      .post(`/ensaios/${ensaioId}/medicoes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ grandeza, valor: 10 })
      .expect(201);
  }
}
