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
import { AtualizarMaquinaDto } from './dto/atualizar-maquina.dto';
import { ConsultarMaquinasDto } from './dto/consultar-maquinas.dto';
import { CriarMaquinaDto } from './dto/criar-maquina.dto';
import { MaquinaEntity } from './maquina.entity';
import { MaquinasService } from './maquinas.service';

@ApiTags('maquinas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
@Roles(Perfil.ENGENHEIRO)
@Controller('maquinas')
export class MaquinasController {
  constructor(private readonly maquinasService: MaquinasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as máquinas (sem a ficha), paginadas' })
  @ApiOkResponse({
    description: '{ dados, pagina, tamanho, total, totalDePaginas }',
  })
  @ApiBadRequestResponse({ description: 'Parâmetros de consulta inválidos' })
  listar(@Query() consulta: ConsultarMaquinasDto) {
    return this.maquinasService.listar(consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe da máquina com a ficha' })
  @ApiOkResponse({ type: MaquinaEntity })
  @ApiNotFoundResponse({ description: 'Máquina não encontrada' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.maquinasService.buscarPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma máquina com a ficha da linha' })
  @ApiCreatedResponse({ type: MaquinaEntity })
  @ApiBadRequestResponse({
    description: 'Dados inválidos, ficha inválida ou tipo incompatível',
  })
  @ApiConflictResponse({ description: 'Número de série já cadastrado' })
  criar(@Body() dto: CriarMaquinaDto) {
    return this.maquinasService.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Altera a máquina; ficha e campos adicionais, se enviados, são substituídos',
  })
  @ApiOkResponse({ type: MaquinaEntity })
  @ApiBadRequestResponse({ description: 'Dados ou ficha inválidos' })
  @ApiNotFoundResponse({ description: 'Máquina não encontrada' })
  @ApiConflictResponse({
    description: 'Número de série repetido ou troca de linha com ensaios',
  })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarMaquinaDto,
  ) {
    return this.maquinasService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma máquina sem ensaios' })
  @ApiNoContentResponse({ description: 'Removida' })
  @ApiNotFoundResponse({ description: 'Máquina não encontrada' })
  @ApiConflictResponse({ description: 'Máquina com ensaios' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.maquinasService.remover(id);
  }
}
