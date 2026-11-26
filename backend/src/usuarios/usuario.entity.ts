import { ApiProperty } from '@nestjs/swagger';
import { Perfil, Usuario } from '../generated/prisma/client';

/** Saída de usuário montada campo a campo: o senhaHash nunca sai da API. */
export class UsuarioEntity {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Artur Analista' })
  nome: string;

  @ApiProperty({ example: 'analista@campo.dev' })
  email: string;

  @ApiProperty({ enum: Perfil })
  perfil: Perfil;

  constructor(usuario: Usuario) {
    this.id = usuario.id;
    this.nome = usuario.nome;
    this.email = usuario.email;
    this.perfil = usuario.perfil;
  }
}
