import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { Perfil } from '../generated/prisma/client';
import { ConsultarFalhasDto } from './dto/consultar-falhas.dto';
import { CriarFalhaDto } from './dto/criar-falha.dto';
import { FalhaEntity } from './falha.entity';
import { FalhasService } from './falhas.service';

@ApiTags('falhas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
@Controller('ensaios/:ensaioId/falhas')
export class FalhasController {
  constructor(private readonly falhasService: FalhasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as falhas do ensaio, paginadas' })
  @ApiOkResponse({
    description: '{ dados, pagina, tamanho, total, totalDePaginas }',
  })
  @ApiForbiddenResponse({ description: 'Ensaio de outro analista' })
  listar(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Query() consulta: ConsultarFalhasDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.falhasService.listar(ensaioId, consulta, usuario);
  }

  @Post()
  @Roles(Perfil.ANALISTA)
  @ApiOperation({
    summary: 'Registra uma falha; em ensaio PLANEJADO, inicia o ensaio',
  })
  @ApiCreatedResponse({ type: FalhaEntity })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiConflictResponse({ description: 'Ensaio enviado ou concluído' })
  criar(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Body() dto: CriarFalhaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.falhasService.criar(ensaioId, dto, usuario);
  }

  @Delete(':id')
  @Roles(Perfil.ANALISTA)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma falha lançada por engano' })
  @ApiNoContentResponse({ description: 'Removida' })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiConflictResponse({ description: 'Ensaio enviado ou concluído' })
  remover(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.falhasService.remover(ensaioId, id, usuario);
  }
}
