import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '../generated/prisma/client';
import { ConsultarUsuariosDto } from './dto/consultar-usuarios.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiForbiddenResponse({ description: 'Perfil sem permissão' })
@Roles(Perfil.ENGENHEIRO)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista usuários, com filtro opcional por perfil' })
  @ApiOkResponse({
    description: '{ dados, pagina, tamanho, total, totalDePaginas }',
  })
  listar(@Query() consulta: ConsultarUsuariosDto) {
    return this.usuariosService.listar(consulta);
  }
}
