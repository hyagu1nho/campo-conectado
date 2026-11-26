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
import { ConsultarMedicoesDto } from './dto/consultar-medicoes.dto';
import { CriarMedicaoDto } from './dto/criar-medicao.dto';
import { MedicaoEntity } from './medicao.entity';
import { MedicoesService } from './medicoes.service';

@ApiTags('medicoes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiNotFoundResponse({ description: 'Ensaio não encontrado' })
@Controller('ensaios/:ensaioId/medicoes')
export class MedicoesController {
  constructor(private readonly medicoesService: MedicoesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as medições do ensaio, paginadas' })
  @ApiOkResponse({
    description: '{ dados, pagina, tamanho, total, totalDePaginas }',
  })
  @ApiForbiddenResponse({ description: 'Ensaio de outro analista' })
  listar(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Query() consulta: ConsultarMedicoesDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.medicoesService.listar(ensaioId, consulta, usuario);
  }

  @Post()
  @Roles(Perfil.ANALISTA)
  @ApiOperation({
    summary: 'Registra uma medição; em ensaio PLANEJADO, inicia o ensaio',
  })
  @ApiCreatedResponse({ type: MedicaoEntity })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiConflictResponse({ description: 'Ensaio enviado ou concluído' })
  criar(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Body() dto: CriarMedicaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.medicoesService.criar(ensaioId, dto, usuario);
  }

  @Delete(':id')
  @Roles(Perfil.ANALISTA)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma medição lançada por engano' })
  @ApiNoContentResponse({ description: 'Removida' })
  @ApiForbiddenResponse({ description: 'Não é o analista do ensaio' })
  @ApiConflictResponse({ description: 'Ensaio enviado ou concluído' })
  remover(
    @Param('ensaioId', ParseIntPipe) ensaioId: number,
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.medicoesService.remover(ensaioId, id, usuario);
  }
}
