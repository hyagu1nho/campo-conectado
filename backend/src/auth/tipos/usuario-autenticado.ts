import { Request } from 'express';
import { Perfil } from '../../generated/prisma/client';

/** O que a API sabe de quem fez a requisição, extraído do token. */
export interface UsuarioAutenticado {
  id: number;
  perfil: Perfil;
}

export interface RequisicaoAutenticada extends Request {
  user?: UsuarioAutenticado;
}

/** Conteúdo assinado dentro do JWT. Nada sensível entra aqui. */
export interface PayloadJwt {
  sub: number;
  perfil: Perfil;
}
