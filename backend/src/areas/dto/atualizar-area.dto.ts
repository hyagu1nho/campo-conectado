import { PartialType } from '@nestjs/swagger';
import { CriarAreaDto } from './criar-area.dto';

// PartialType vem de @nestjs/swagger (e não de @nestjs/mapped-types) para o
// PATCH aparecer com os campos na documentação.
// skipNullProperties: false faz `null` ser validado: `{ "nome": null }` dá 400,
// enquanto campos opcionais (hectares, tipoSolo...) aceitam null para limpar.
export class AtualizarAreaDto extends PartialType(CriarAreaDto, {
  skipNullProperties: false,
}) {}
