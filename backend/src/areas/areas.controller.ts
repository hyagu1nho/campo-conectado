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
import { Perfil } from '../generated/prisma/client';
import { AreaEntity } from './area.entity';
import { AreasService } from './areas.service';
import { AtualizarAreaDto } from './dto/atualizar-area.dto';
import { ConsultarAreasDto } from './dto/consultar-areas.dto';
import { CriarAreaDto } from './dto/criar-area.dto';

@ApiTags('areas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
@Roles(Perfil.ENGENHEIRO)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as áreas, paginadas e em ordem de nome' })
  @ApiOkResponse({
    description: '{ dados, pagina, tamanho, total, totalDePaginas }',
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos' })
  listar(@Query() consulta: ConsultarAreasDto) {
    return this.areasService.listar(consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma área pelo id' })
  @ApiOkResponse({ type: AreaEntity })
  @ApiNotFoundResponse({ description: 'Área não encontrada' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.buscarPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma área' })
  @ApiCreatedResponse({ type: AreaEntity })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'Nome já cadastrado' })
  criar(@Body() dto: CriarAreaDto) {
    return this.areasService.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Altera dados de uma área' })
  @ApiOkResponse({ type: AreaEntity })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiNotFoundResponse({ description: 'Área não encontrada' })
  @ApiConflictResponse({ description: 'Nome já cadastrado' })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarAreaDto,
  ) {
    return this.areasService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma área sem ensaios' })
  @ApiNoContentResponse({ description: 'Removida' })
  @ApiNotFoundResponse({ description: 'Área não encontrada' })
  @ApiConflictResponse({ description: 'Área com ensaios vinculados' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.remover(id);
  }
}
