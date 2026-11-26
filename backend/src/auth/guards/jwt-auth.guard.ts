import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** Guard global: toda rota exige token válido, exceto as marcadas com @Public. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(contexto: ExecutionContext) {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publica) return true;
    return super.canActivate(contexto);
  }
}
