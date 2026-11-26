import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PayloadJwt } from './tipos/usuario-autenticado';

const CREDENCIAIS_INVALIDAS = 'e-mail ou senha inválidos';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * A mesma mensagem para e-mail inexistente e senha errada: não revela
   * quais e-mails estão cadastrados.
   */
  async login({ email, senha }: LoginDto): Promise<{ accessToken: string }> {
    // O bcrypt só considera os primeiros 72 bytes; senha maior é recusada.
    if (bcrypt.truncates(senha)) {
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    const senhaConfere =
      usuario !== null && (await bcrypt.compare(senha, usuario.senhaHash));
    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const payload: PayloadJwt = { sub: usuario.id, perfil: usuario.perfil };
    return { accessToken: await this.jwt.signAsync(payload) };
  }

  /**
   * Dados de quem está logado, lidos do banco (o token só tem id e perfil).
   * Usuário removido depois do login perde o acesso: 401.
   */
  async perfil(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, perfil: true },
    });
    if (!usuario) throw new UnauthorizedException('usuário não encontrado');
    return usuario;
  }
}
