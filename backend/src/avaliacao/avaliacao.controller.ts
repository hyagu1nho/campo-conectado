import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/tipos/usuario-autenticado';
import { Criterio, Perfil } from '../generated/prisma/client';
import { AvaliacaoEntity } from './avaliacao.entity';
import { AvaliacaoService } from './avaliacao.service';
import { AtualizarAvaliacaoDto } from './dto/atualizar-avaliacao.dto';
import { AvaliarCriterioDto } from './dto/avaliar-criterio.dto';

@ApiTags('avaliacao')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
@ApiBadRequestResponse({
  description: 'Dados inválidos ou ensaio fora da linha PULVERIZACAO',
})
@Controller('ensaios/:ensaioId/avaliacao')
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @Get()
  @ApiOperation({
    summary: 'Avaliação da Pulverização com evidências e pendências de envio',
  })
  @ApiOkResponse({ type: AvaliacaoEntity })
  @ApiForbiddenResponse({ description: 'Ensaio de outro analista' })
  buscar(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.avaliacaoService.buscar(ensaioId, usuario);
  }

  @Patch()
  @Roles(Perfil.ANALISTA)
  @ApiOperation({
    summary: 'Salva campos objetivos e parecer final (parcial; null apaga)',
  })
  @ApiOkResponse({ type: AvaliacaoEntity })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiConflictResponse({ description: 'Ensaio enviado ou concluído' })
  atualizar(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Body() dto: AtualizarAvaliacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.avaliacaoService.atualizar(ensaioId, dto, usuario);
  }

  @Put('criterios/:criterio')
  @Roles(Perfil.ANALISTA)
  @ApiOperation({ summary: 'Salva o parecer de um critério' })
  @ApiParam({ name: 'criterio', enum: Criterio })
  @ApiOkResponse({ type: AvaliacaoEntity })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiConflictResponse({ description: 'Ensaio enviado ou concluído' })
  avaliarCriterio(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Param(
      'criterio',
      new ParseEnumPipe(Criterio, {
        exceptionFactory: () =>
          new BadRequestException(
            `criterio deve ser um destes: ${Object.values(Criterio).join(', ')}`,
          ),
      }),
    )
    criterio: Criterio,
    @Body() dto: AvaliarCriterioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.avaliacaoService.avaliarCriterio(
      ensaioId,
      criterio,
      dto,
      usuario,
    );
  }
}
