import { SetMetadata } from '@nestjs/common';
import { Perfil } from '../../generated/prisma/client';

export const PERFIS_KEY = 'perfis';

/** Restringe a rota aos perfis informados. Sem @Roles, basta estar autenticado. */
export const Roles = (...perfis: Perfil[]) => SetMetadata(PERFIS_KEY, perfis);
