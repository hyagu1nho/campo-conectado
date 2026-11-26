import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { LoginDto } from './dto/login.dto';
import type { UsuarioAutenticado } from './tipos/usuario-autenticado';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Troca e-mail e senha por um token JWT' })
  @ApiOkResponse({ description: '{ accessToken }' })
  @ApiBadRequestResponse({ description: 'Corpo inválido' })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha inválidos' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Devolve id, nome, e-mail e perfil do dono do token',
  })
  @ApiOkResponse({ description: '{ id, nome, email, perfil }' })
  @ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
  perfil(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.authService.perfil(usuario.id);
  }
}
