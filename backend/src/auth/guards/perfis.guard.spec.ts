import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '../../generated/prisma/client';
import { PerfisGuard } from './perfis.guard';

function contextoCom(user?: { id: number; perfil: Perfil }): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PerfisGuard', () => {
  const reflector = new Reflector();
  const guard = new PerfisGuard(reflector);

  afterEach(() => jest.restoreAllMocks());

  it('sem @Roles libera qualquer autenticado', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextoCom({ id: 1, perfil: 'ANALISTA' }))).toBe(
      true,
    );
  });

  it('libera o perfil exigido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ENGENHEIRO']);
    expect(
      guard.canActivate(contextoCom({ id: 1, perfil: 'ENGENHEIRO' })),
    ).toBe(true);
  });

  it('bloqueia outro perfil (vira 403)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ENGENHEIRO']);
    expect(guard.canActivate(contextoCom({ id: 2, perfil: 'ANALISTA' }))).toBe(
      false,
    );
  });
});
