import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { AtualizarEnsaioDto } from './dto/atualizar-ensaio.dto';
import { ConsultarEnsaiosDto } from './dto/consultar-ensaios.dto';
import { CriarEnsaioDto } from './dto/criar-ensaio.dto';
import { DevolverEnsaioDto } from './dto/devolver-ensaio.dto';
import { EnsaioEntity } from './ensaio.entity';
import { EnsaiosService } from './ensaios.service';

@ApiTags('ensaios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@Controller('ensaios')
export class EnsaiosController {
  constructor(private readonly ensaiosService: EnsaiosService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista ensaios; o analista vê só os atribuídos a ele',
  })
  @ApiOkResponse({
    description: '{ dados, pagina, tamanho, total, totalDePaginas }',
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos' })
  listar(
    @Query() consulta: ConsultarEnsaiosDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.listar(consulta, usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do ensaio com as devoluções' })
  @ApiOkResponse({ type: EnsaioEntity })
  @ApiForbiddenResponse({ description: 'Ensaio de outro analista' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.buscarPorId(id, usuario);
  }

  @Get(':id/pendencias')
  @ApiOperation({
    summary: 'O que falta para enviar e concluir (lista vazia: pronto)',
  })
  @ApiOkResponse({ description: '{ pendencias: string[] }' })
  @ApiForbiddenResponse({ description: 'Ensaio de outro analista' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  pendencias(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.pendencias(id, usuario);
  }

  @Post()
  @Roles(Perfil.ENGENHEIRO)
  @ApiOperation({ summary: 'Planeja um ensaio e o atribui a um analista' })
  @ApiCreatedResponse({ type: EnsaioEntity })
  @ApiBadRequestResponse({
    description: 'Dados inválidos, ou máquina, área ou analista inexistente',
  })
  @ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
  criar(
    @Body() dto: CriarEnsaioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.criar(dto, usuario);
  }

  @Patch(':id')
  @Roles(Perfil.ENGENHEIRO)
  @ApiOperation({ summary: 'Altera o planejamento de um ensaio PLANEJADO' })
  @ApiOkResponse({ type: EnsaioEntity })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  @ApiConflictResponse({ description: 'Ensaio já iniciado' })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarEnsaioDto,
  ) {
    return this.ensaiosService.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Perfil.ENGENHEIRO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um ensaio PLANEJADO' })
  @ApiNoContentResponse({ description: 'Removido' })
  @ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  @ApiConflictResponse({ description: 'Ensaio já iniciado' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.ensaiosService.remover(id);
  }

  @Post(':id/iniciar')
  @Roles(Perfil.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'O analista inicia o ensaio (PLANEJADO)' })
  @ApiOkResponse({ type: EnsaioEntity })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  @ApiConflictResponse({ description: 'Situação não permite iniciar' })
  iniciar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.iniciar(id, usuario);
  }

  @Post(':id/enviar')
  @Roles(Perfil.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'O analista envia o ensaio ao engenheiro (EM_ANDAMENTO ou DEVOLVIDO)',
  })
  @ApiOkResponse({ type: EnsaioEntity })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  @ApiBadRequestResponse({
    description: 'Pendências: medições mínimas ou avaliação incompleta',
  })
  @ApiConflictResponse({ description: 'Situação não permite enviar' })
  enviar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.enviar(id, usuario);
  }

  @Post(':id/devolver')
  @Roles(Perfil.ENGENHEIRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'O engenheiro devolve o ensaio ENVIADO com comentário',
  })
  @ApiOkResponse({ type: EnsaioEntity })
  @ApiBadRequestResponse({ description: 'Comentário ausente' })
  @ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  @ApiConflictResponse({ description: 'Situação não permite devolver' })
  devolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DevolverEnsaioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.devolver(id, dto.comentario, usuario);
  }

  @Post(':id/concluir')
  @Roles(Perfil.ENGENHEIRO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'O engenheiro conclui o ensaio ENVIADO' })
  @ApiOkResponse({ type: EnsaioEntity })
  @ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
  @ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
  @ApiBadRequestResponse({ description: 'Pendências para concluir' })
  @ApiConflictResponse({ description: 'Situação não permite concluir' })
  concluir(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ensaiosService.concluir(id, usuario);
  }
}
