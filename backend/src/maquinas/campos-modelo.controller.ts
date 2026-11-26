import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '../generated/prisma/client';
import { ConsultarCamposModeloDto } from './dto/consultar-campos-modelo.dto';
import { FormularioLinhaEntity } from './maquina.entity';
import { MaquinasService } from './maquinas.service';

/** Formulário pré-pronto de cada linha: o cliente monta a ficha a partir daqui. */
@ApiTags('maquinas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sem token ou token inválido' })
@ApiForbiddenResponse({ description: 'Somente o perfil ENGENHEIRO' })
@Roles(Perfil.ENGENHEIRO)
@Controller('campos-modelo')
export class CamposModeloController {
  constructor(private readonly maquinasService: MaquinasService) {}

  @Get()
  @ApiOperation({ summary: 'Tipos aceitos e campos da ficha de uma linha' })
  @ApiOkResponse({ type: FormularioLinhaEntity })
  @ApiBadRequestResponse({ description: 'Linha ausente ou inválida' })
  formulario(@Query() consulta: ConsultarCamposModeloDto) {
    return this.maquinasService.formularioDaLinha(consulta.linha);
  }
}
