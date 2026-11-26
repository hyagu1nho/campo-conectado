import { PartialType } from '@nestjs/swagger';
import { CriarEnsaioDto } from './criar-ensaio.dto';

/** Tudo opcional. Só é aceito enquanto o ensaio está PLANEJADO. */
export class AtualizarEnsaioDto extends PartialType(CriarEnsaioDto, {
  skipNullProperties: false,
}) {}
