import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/models/enums.dart';
import 'package:mobile/services/api.dart';

import 'apoio.dart';

void main() {
  group('4.0: primeira chamada', () {
    test('GET /saude com status ok', () async {
      Uri? pedida;
      final api = apiCom((req) async {
        pedida = req.url;
        return respostaJson({'status': 'ok', 'banco': 'ok'});
      });
      expect(await api.saude(), isTrue);
      expect(pedida?.path, '/saude');
    });
  });

  group('login', () {
    test('envia e-mail e senha em JSON e devolve o token', () async {
      late http.Request recebida;
      final api = apiCom((req) async {
        recebida = req;
        return respostaJson({'accessToken': 'abc.def.ghi'});
      });

      final token = await api.entrar(email: 'a@b.c', senha: 'x');

      expect(token, 'abc.def.ghi');
      expect(recebida.method, 'POST');
      expect(recebida.url.path, '/auth/login');
      expect(recebida.headers['Content-Type'], startsWith('application/json'));
      expect(jsonDecode(recebida.body), {'email': 'a@b.c', 'senha': 'x'});
    });

    test('401 vira ErroDaApi com os detalhes da API', () async {
      final api = apiCom(
        (_) async => respostaErro(401, ['e-mail ou senha inválidos']),
      );
      expect(
        () => api.entrar(email: 'a@b.c', senha: 'errada'),
        throwsA(
          isA<ErroDaApi>()
              .having((e) => e.status, 'status', 401)
              .having((e) => e.detalhes, 'detalhes', [
                'e-mail ou senha inválidos',
              ]),
        ),
      );
    });
  });

  group('meus ensaios', () {
    test('pede 100 por página com o token e lê o envelope', () async {
      late http.Request recebida;
      final api = apiCom((req) async {
        recebida = req;
        return respostaJson({
          'dados': [ensaioJson],
          'pagina': 1,
          'tamanho': 100,
          'total': 1,
          'totalDePaginas': 1,
        });
      });

      final ensaios = await api.listarEnsaios('tk');

      expect(recebida.url.path, '/ensaios');
      expect(recebida.url.queryParameters['tamanho'], '100');
      expect(recebida.headers['Authorization'], 'Bearer tk');
      expect(ensaios.single.situacao, Situacao.emAndamento);
      expect(ensaios.single.linha, Linha.pulverizacao);
      expect(ensaios.single.area, 'Área Norte');
    });

    test('item fora do formato vira RespostaInesperada', () async {
      final api = apiCom(
        (_) async => respostaJson({
          'dados': [
            {'id': 'sete'},
          ],
        }),
      );
      expect(
        () => api.listarEnsaios('tk'),
        throwsA(isA<RespostaInesperada>()),
      );
    });
  });

  group('registros', () {
    test('medição manda só os campos preenchidos', () async {
      late http.Request recebida;
      final api = apiCom((req) async {
        recebida = req;
        return respostaJson({
          'id': 1,
          'grandeza': 'VELOCIDADE',
          'valor': 18,
          'horimetro': null,
          'observacao': null,
          'registradaEm': '2026-11-23T10:00:00.000Z',
        }, 201);
      });

      final medicao = await api.registrarMedicao(
        'tk',
        7,
        grandeza: Grandeza.velocidade,
        valor: 18,
      );

      expect(recebida.url.path, '/ensaios/7/medicoes');
      expect(jsonDecode(recebida.body), {'grandeza': 'VELOCIDADE', 'valor': 18});
      // O JSON trouxe 18 (int) e o modelo guarda double.
      expect(medicao.valor, 18.0);
    });

    test('ensaio enviado recusa registro com 409', () async {
      final api = apiCom(
        (_) async => respostaErro(409, [
          'Ensaio ENVIADO não aceita registros; só PLANEJADO, EM_ANDAMENTO ou DEVOLVIDO',
        ]),
      );
      try {
        await api.registrarFalha(
          'tk',
          7,
          descricao: 'x',
          severidade: Severidade.menor,
        );
        fail('deveria lançar');
      } on ErroDaApi catch (e) {
        expect(e.status, 409);
        expect(descreverFalha(e), contains('não aceita registros'));
      }
    });
  });

  group('falhas de transporte', () {
    test('sem conexão', () async {
      final api = apiCom((_) async => throw http.ClientException('recusada'));
      expect(api.saude, throwsA(isA<SemConexao>()));
    });

    test('tempo esgotado', () async {
      final api = apiCom(
        (_) => Completer<http.Response>().future,
        limite: const Duration(milliseconds: 50),
      );
      expect(api.saude, throwsA(isA<TempoEsgotado>()));
    });

    test('corpo que não é JSON', () async {
      final api = apiCom((_) async => http.Response('<html>', 200));
      expect(api.saude, throwsA(isA<RespostaInesperada>()));
    });
  });

  group('mensagens', () {
    test('cada falha tem uma mensagem em português', () {
      expect(descreverFalha(const SemConexao()), 'Sem conexão com o servidor.');
      expect(
        descreverFalha(const ErroDaApi(403, [])),
        'Seu perfil não tem permissão para isso.',
      );
      expect(descreverFalha(const ErroDaApi(400, ['a', 'b'])), 'a\nb');
      expect(
        descreverFalha(const ErroDaApi(500, ['detalhe interno'])),
        isNot(contains('detalhe interno')),
      );
    });
  });
}
