import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/services/api.dart';

/// Resposta JSON em UTF-8 (o construtor de texto do http usaria latin1).
http.Response respostaJson(Object? corpo, [int status = 200]) {
  return http.Response.bytes(
    utf8.encode(jsonEncode(corpo)),
    status,
    headers: {'content-type': 'application/json; charset=utf-8'},
  );
}

/// Corpo de erro padrão da API.
http.Response respostaErro(int status, List<String> detalhes) {
  return respostaJson({
    'status': status,
    'titulo': 'ERRO',
    'detalhes': detalhes,
    'caminho': '/',
    'momento': '2026-11-23T10:00:00.000Z',
  }, status);
}

/// ApiCampo com um servidor falso; nada sai para a rede.
ApiCampo apiCom(
  Future<http.Response> Function(http.Request requisicao) responder, {
  Duration limite = const Duration(seconds: 10),
}) {
  return ApiCampo(
    base: Uri.parse('http://api.teste'),
    cliente: MockClient(responder),
    limite: limite,
  );
}

const ensaioJson = {
  'id': 7,
  'objetivo': 'Avaliar desempenho do pulverizador',
  'situacao': 'EM_ANDAMENTO',
  'dataPrevista': '2026-12-01',
  'maquina': {
    'id': 4,
    'modelo': 'Pulverizador P-3000',
    'numeroSerie': 'PV-0001',
    'linha': 'PULVERIZACAO',
  },
  'area': {'id': 3, 'nome': 'Área Norte'},
  'analista': {'id': 5, 'nome': 'Artur Analista'},
};
