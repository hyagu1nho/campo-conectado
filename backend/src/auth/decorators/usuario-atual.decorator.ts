import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  RequisicaoAutenticada,
  UsuarioAutenticado,
} from '../tipos/usuario-autenticado';

/** Injeta no parâmetro o usuário do token: @UsuarioAtual() usuario. */
export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    const requisicao = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    return requisicao.user!;
  },
);
