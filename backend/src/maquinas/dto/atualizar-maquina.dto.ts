import { PartialType } from '@nestjs/swagger';
import { CriarMaquinaDto } from './criar-maquina.dto';

/**
 * Tudo opcional. Quando `ficha` vem, ela substitui a ficha inteira; quando
 * `camposAdicionais` vem, substitui a lista inteira. Trocar a linha exige
 * mandar a ficha da nova linha, e só é aceito se a máquina não tem ensaios.
 */
export class AtualizarMaquinaDto extends PartialType(CriarMaquinaDto, {
  skipNullProperties: false,
}) {}
