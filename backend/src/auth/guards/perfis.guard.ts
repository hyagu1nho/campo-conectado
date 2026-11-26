import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '../../generated/prisma/client';
import { PERFIS_KEY } from '../decorators/roles.decorator';
import { RequisicaoAutenticada } from '../tipos/usuario-autenticado';

/**
 * Guard global de autorização. Roda DEPOIS do JwtAuthGuard (ordem no AuthModule).
 * Devolver false faz o Nest responder 403: sabe quem é, mas não pode.
 */
@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Perfil[] | undefined>(
      PERFIS_KEY,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (!exigidos || exigidos.length === 0) return true;

    const { user } = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    return !!user && exigidos.includes(user.perfil);
  }
}
