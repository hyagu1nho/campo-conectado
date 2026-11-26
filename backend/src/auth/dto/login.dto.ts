import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'engenheiro@campo.dev' })
  @IsEmail({}, { message: 'informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'engenheiro123' })
  @IsString({ message: 'a senha deve ser um texto' })
  @IsNotEmpty({ message: 'a senha é obrigatória' })
  senha!: string;
}
