import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import type { Prisma } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { conferirRegistro } from './ciclo';

type Cliente = Prisma.TransactionClient | PrismaService;

/** O analista só mexe nos ensaios atribuídos a ele; o engenheiro, em todos. */
export function garantirAcesso(
  ensaio: { analistaId: number },
  usuario: UsuarioAutenticado,
) {
  if (usuario.perfil === 'ANALISTA' && ensaio.analistaId !== usuario.id) {
    throw new ForbiddenException('Este ensaio está atribuído a outro analista');
  }
}

/** Confere que o ensaio existe e que o usuário pode vê-lo. */
export async function abrirParaLeitura(
  cliente: Cliente,
  ensaioId: number,
  usuario: UsuarioAutenticado,
) {
  const ensaio = await cliente.ensaio.findUnique({
    where: { id: ensaioId },
    select: { situacao: true, analistaId: true },
  });
  if (!ensaio) throw new NotFoundException(`Ensaio ${ensaioId} não encontrado`);
  garantirAcesso(ensaio, usuario);
  return ensaio;
}

/**
 * Confere que o ensaio aceita registros do usuário. Se ainda está
 * PLANEJADO, o primeiro registro inicia o ensaio. Deve rodar dentro da
 * mesma transação que grava o registro.
 */
export async function abrirParaRegistro(
  tx: Prisma.TransactionClient,
  ensaioId: number,
  usuario: UsuarioAutenticado,
) {
  const ensaio = await abrirParaLeitura(tx, ensaioId, usuario);
  const erro = conferirRegistro(ensaio.situacao);
  if (erro) throw new ConflictException(erro);
  if (ensaio.situacao === 'PLANEJADO') {
    await tx.ensaio.updateMany({
      where: { id: ensaioId, situacao: 'PLANEJADO' },
      data: { situacao: 'EM_ANDAMENTO' },
    });
  }
}
