import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadJwt, UsuarioAutenticado } from '../tipos/usuario-autenticado';

/**
 * Lê o token do cabeçalho "Authorization: Bearer <token>" e confere
 * assinatura e expiração. O retorno de validate() vira request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: PayloadJwt): UsuarioAutenticado {
    return { id: payload.sub, perfil: payload.perfil };
  }
}
