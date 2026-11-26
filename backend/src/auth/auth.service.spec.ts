import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = { usuario: { findUnique: jest.fn() } };
  const jwt = { signAsync: jest.fn() };
  let senhaHash: string;

  beforeAll(async () => {
    senhaHash = await bcrypt.hash('senha-correta', 4);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = modulo.get(AuthService);
  });

  it('com credenciais corretas assina token com id e perfil', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      perfil: 'ENGENHEIRO',
      senhaHash,
    });
    jwt.signAsync.mockResolvedValue('token-assinado');

    await expect(
      service.login({ email: 'e@x.dev', senha: 'senha-correta' }),
    ).resolves.toEqual({ accessToken: 'token-assinado' });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 7,
      perfil: 'ENGENHEIRO',
    });
  });

  it('perfil devolve os dados do usuário, sem a senha', async () => {
    const dados = {
      id: 7,
      nome: 'Eduarda',
      email: 'e@x.dev',
      perfil: 'ENGENHEIRO',
    };
    prisma.usuario.findUnique.mockResolvedValue(dados);

    await expect(service.perfil(7)).resolves.toEqual(dados);
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true, nome: true, email: true, perfil: true },
    });
  });

  it('perfil de usuário removido dá 401', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(service.perfil(99)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('senha errada e e-mail inexistente dão a mesma mensagem 401', async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({
      id: 7,
      perfil: 'ENGENHEIRO',
      senhaHash,
    });
    const senhaErrada = service.login({ email: 'e@x.dev', senha: 'errada' });
    await expect(senhaErrada).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.usuario.findUnique.mockResolvedValueOnce(null);
    const emailInexistente = service.login({ email: 'n@x.dev', senha: 'x' });

    const [erro1, erro2] = await Promise.all([
      senhaErrada.catch((e: Error) => e.message),
      emailInexistente.catch((e: Error) => e.message),
    ]);
    expect(erro1).toBe(erro2);
  });

  it('senha com mais de 72 bytes é recusada sem consultar o banco', async () => {
    await expect(
      service.login({ email: 'e@x.dev', senha: 'a'.repeat(73) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });
});
