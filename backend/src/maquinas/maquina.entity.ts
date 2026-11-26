import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CampoAdicional,
  CampoModelo,
  Maquina,
  ValorCampo,
} from '../generated/prisma/client';
import { Linha, TipoCampo, TipoMaquina } from '../generated/prisma/client';
import { lerValor, tiposDaLinha } from './ficha';

/** Campo pré-pronto de uma linha, como o cliente precisa para montar o formulário. */
export class CampoModeloEntity {
  @ApiProperty({ example: 'capacidadeTanque' })
  chave: string;

  @ApiProperty({ example: 'Capacidade do tanque' })
  rotulo: string;

  @ApiProperty({ enum: TipoCampo })
  tipo: TipoCampo;

  @ApiPropertyOptional({ example: 'L', nullable: true, type: String })
  unidade: string | null;

  @ApiProperty()
  obrigatorio: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  minimo: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  maximo: number | null;

  @ApiProperty({ type: [String] })
  opcoes: string[];

  @ApiProperty()
  ordem: number;

  constructor(campo: CampoModelo) {
    this.chave = campo.chave;
    this.rotulo = campo.rotulo;
    this.tipo = campo.tipo;
    this.unidade = campo.unidade;
    this.obrigatorio = campo.obrigatorio;
    this.minimo = campo.minimo?.toNumber() ?? null;
    this.maximo = campo.maximo?.toNumber() ?? null;
    this.opcoes = campo.opcoes;
    this.ordem = campo.ordem;
  }
}

/** Resposta de GET /campos-modelo: tipos aceitos e campos da ficha da linha. */
export class FormularioLinhaEntity {
  @ApiProperty({ enum: Linha })
  linha: Linha;

  @ApiProperty({ enum: TipoMaquina, isArray: true })
  tipos: TipoMaquina[];

  @ApiProperty({ type: [CampoModeloEntity] })
  campos: CampoModeloEntity[];

  constructor(linha: Linha, campos: CampoModelo[]) {
    this.linha = linha;
    this.tipos = tiposDaLinha(linha);
    this.campos = campos.map((campo) => new CampoModeloEntity(campo));
  }
}

export class ItemFichaEntity {
  @ApiProperty({ example: 'capacidadeTanque' })
  chave: string;

  @ApiProperty({ example: 'Capacidade do tanque' })
  rotulo: string;

  @ApiProperty({ enum: TipoCampo })
  tipo: TipoCampo;

  @ApiPropertyOptional({ example: 'L', nullable: true, type: String })
  unidade: string | null;

  @ApiProperty({ example: 3000, description: 'No tipo do campo' })
  valor: string | number | boolean;
}

export class CampoAdicionalEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Marcador de linha' })
  nome: string;

  @ApiProperty({ example: 'Hidráulico' })
  valor: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  unidade: string | null;
}

/** Item da listagem: sem a ficha, para a lista ficar leve. */
export class MaquinaResumoEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Pulverizador P-3000' })
  modelo: string;

  @ApiProperty({ example: 'PV-0001' })
  numeroSerie: string;

  @ApiProperty({ enum: Linha })
  linha: Linha;

  @ApiProperty({ enum: TipoMaquina })
  tipo: TipoMaquina;

  constructor(maquina: Maquina) {
    this.id = maquina.id;
    this.modelo = maquina.modelo;
    this.numeroSerie = maquina.numeroSerie;
    this.linha = maquina.linha;
    this.tipo = maquina.tipo;
  }
}

export type MaquinaCompleta = Maquina & {
  valores: (ValorCampo & { campoModelo: CampoModelo })[];
  camposAdicionais: CampoAdicional[];
};

/** Detalhe da máquina com a ficha montada na ordem dos campos da linha. */
export class MaquinaEntity extends MaquinaResumoEntity {
  @ApiProperty({ type: [ItemFichaEntity] })
  ficha: ItemFichaEntity[];

  @ApiProperty({ type: [CampoAdicionalEntity] })
  camposAdicionais: CampoAdicionalEntity[];

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;

  constructor(maquina: MaquinaCompleta) {
    super(maquina);
    this.ficha = [...maquina.valores]
      .sort((a, b) => a.campoModelo.ordem - b.campoModelo.ordem)
      .map(({ campoModelo, valor }) => ({
        chave: campoModelo.chave,
        rotulo: campoModelo.rotulo,
        tipo: campoModelo.tipo,
        unidade: campoModelo.unidade,
        valor: lerValor(campoModelo.tipo, valor),
      }));
    this.camposAdicionais = maquina.camposAdicionais.map(
      ({ id, nome, valor, unidade }) => ({ id, nome, valor, unidade }),
    );
    this.criadoEm = maquina.criadoEm;
    this.atualizadoEm = maquina.atualizadoEm;
  }
}
