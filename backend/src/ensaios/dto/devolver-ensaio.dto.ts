import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DevolverEnsaioDto {
  @ApiProperty({
    example: 'Faltou registrar a temperatura do hidráulico na segunda hora',
    maxLength: 1000,
  })
  @IsString({ message: 'o comentário deve ser um texto' })
  @IsNotEmpty({ message: 'o comentário é obrigatório para devolver' })
  @MaxLength(1000, {
    message: 'o comentário deve ter no máximo 1000 caracteres',
  })
  comentario!: string;
}
