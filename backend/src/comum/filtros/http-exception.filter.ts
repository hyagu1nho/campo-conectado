import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Formato único de erro da API (padrão da Aula 6):
 * { status, titulo, detalhes[], caminho, momento }
 *
 * Em erro 5xx a mensagem original nunca vai para o cliente: ela pode vazar
 * detalhes internos (tabela, coluna, stack). Fica só no log do servidor.
 */
@Catch()
export class FiltroDeExcecoes implements ExceptionFilter {
  private readonly logger = new Logger(FiltroDeExcecoes.name);

  catch(excecao: unknown, host: ArgumentsHost) {
    const contexto = host.switchToHttp();
    const resposta = contexto.getResponse<Response>();
    const requisicao = contexto.getRequest<Request>();

    const status =
      excecao instanceof HttpException
        ? excecao.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let detalhes: string[];
    if (status >= 500) {
      this.logger.error(excecao instanceof Error ? excecao.stack : excecao);
      detalhes = ['Erro interno do servidor'];
    } else {
      detalhes = this.extrairDetalhes(excecao as HttpException);
    }

    resposta.status(status).json({
      status,
      titulo: HttpStatus[status] ?? 'ERRO',
      detalhes,
      caminho: requisicao.url,
      momento: new Date().toISOString(),
    });
  }

  /** O `message` do Nest pode ser texto ou lista (erros de validação). */
  private extrairDetalhes(excecao: HttpException): string[] {
    const corpo = excecao.getResponse();
    if (typeof corpo === 'string') return [corpo];
    const mensagem = (corpo as { message?: string | string[] }).message;
    if (Array.isArray(mensagem)) return mensagem;
    return [mensagem ?? excecao.message];
  }
}
