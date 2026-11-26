import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/avaliacao.dart';
import '../models/ensaio.dart';
import '../models/enums.dart';
import '../models/registros.dart';

/// Por que uma chamada à API não deu certo. As telas mostram a mensagem de
/// [descreverFalha]; nenhuma tela importa `http`.
class FalhaDaApi implements Exception {
  const FalhaDaApi();
}

class SemConexao extends FalhaDaApi {
  const SemConexao();
}

class TempoEsgotado extends FalhaDaApi {
  const TempoEsgotado();
}

/// A API respondeu com erro. `detalhes` vem do corpo de erro padrão
/// `{status, titulo, detalhes, caminho, momento}`.
class ErroDaApi extends FalhaDaApi {
  const ErroDaApi(this.status, this.detalhes);
  final int status;
  final List<String> detalhes;
}

class RespostaInesperada extends FalhaDaApi {
  const RespostaInesperada();
}

String descreverFalha(FalhaDaApi falha) {
  if (falha is SemConexao) return 'Sem conexão com o servidor.';
  if (falha is TempoEsgotado) {
    return 'O servidor demorou para responder. Tente de novo.';
  }
  if (falha is ErroDaApi) {
    if (falha.status == 401) {
      return 'Sua sessão expirou ou não é válida. Entre de novo.';
    }
    if (falha.status == 403) return 'Seu perfil não tem permissão para isso.';
    if (falha.status >= 500) {
      return 'O servidor teve um problema. Tente de novo em instantes.';
    }
    if (falha.detalhes.isEmpty) {
      return 'A API recusou o pedido (${falha.status}).';
    }
    return falha.detalhes.join('\n');
  }
  return 'A API respondeu num formato inesperado.';
}

/// Quem é o dono do token, como a API informa em GET /auth/perfil.
class PerfilDoUsuario {
  const PerfilDoUsuario({required this.id, required this.perfil});
  final int id;
  final String perfil;
}

/// Cliente da API do Campo Conectado, do ponto de vista do analista.
/// O `http.Client` é injetado para os testes usarem `MockClient`.
class ApiCampo {
  ApiCampo({
    required this.base,
    http.Client? cliente,
    this.limite = const Duration(seconds: 10),
  }) : _cliente = cliente ?? http.Client();

  final Uri base;
  final Duration limite;
  final http.Client _cliente;

  void fechar() => _cliente.close();

  // ---------------------------------------------------------------- 4.0

  /// GET /saude: a primeira chamada do app, para saber se a API está no ar.
  Future<bool> saude() async {
    final json = await _requisitar('GET', '/saude');
    return json is Map<String, dynamic> && json['status'] == 'ok';
  }

  // ---------------------------------------------------------------- 4.1

  /// POST /auth/login. Devolve o token; quem guarda é a Sessao (em memória).
  Future<String> entrar({required String email, required String senha}) async {
    final json = await _requisitar(
      'POST',
      '/auth/login',
      corpo: {'email': email, 'senha': senha},
    );
    if (json is Map<String, dynamic> && json['accessToken'] is String) {
      return json['accessToken'] as String;
    }
    throw const RespostaInesperada();
  }

  /// GET /auth/perfil: quem é o dono do token. O app não decodifica o JWT.
  Future<PerfilDoUsuario> perfil(String token) async {
    final json = await _requisitar('GET', '/auth/perfil', token: token);
    if (json is Map<String, dynamic> &&
        json['id'] is int &&
        json['perfil'] is String) {
      return PerfilDoUsuario(
        id: json['id'] as int,
        perfil: json['perfil'] as String,
      );
    }
    throw const RespostaInesperada();
  }

  // ---------------------------------------------------------------- 4.2

  /// Meus ensaios: a API filtra pelo analista do token.
  Future<List<Ensaio>> listarEnsaios(String token) async {
    final json = await _requisitar(
      'GET',
      '/ensaios',
      token: token,
      consulta: {'tamanho': '100'},
    );
    return _dados(json, Ensaio.fromJson);
  }

  Future<Ensaio> buscarEnsaio(String token, int id) async {
    return _objeto(
      await _requisitar('GET', '/ensaios/$id', token: token),
      Ensaio.fromJson,
    );
  }

  /// O que ainda impede o envio (medições mínimas e avaliação).
  Future<List<String>> pendencias(String token, int id) async {
    final json = await _requisitar(
      'GET',
      '/ensaios/$id/pendencias',
      token: token,
    );
    if (json is Map<String, dynamic> && json['pendencias'] is List) {
      final lista = json['pendencias'] as List<dynamic>;
      return [for (final p in lista) p.toString()];
    }
    throw const RespostaInesperada();
  }

  Future<Ensaio> enviar(String token, int id) async {
    return _objeto(
      await _requisitar('POST', '/ensaios/$id/enviar', token: token),
      Ensaio.fromJson,
    );
  }

  // ---------------------------------------------------------------- 4.3

  Future<List<Medicao>> listarMedicoes(String token, int ensaioId) async {
    final json = await _requisitar(
      'GET',
      '/ensaios/$ensaioId/medicoes',
      token: token,
      consulta: {'tamanho': '100'},
    );
    return _dados(json, Medicao.fromJson);
  }

  /// Em ensaio PLANEJADO, o primeiro registro já inicia o ensaio na API.
  Future<Medicao> registrarMedicao(
    String token,
    int ensaioId, {
    required Grandeza grandeza,
    required double valor,
    double? horimetro,
    String? observacao,
  }) async {
    final json = await _requisitar(
      'POST',
      '/ensaios/$ensaioId/medicoes',
      token: token,
      corpo: {
        'grandeza': grandeza.api,
        'valor': valor,
        'horimetro': ?horimetro,
        'observacao': ?observacao,
      },
    );
    return _objeto(json, Medicao.fromJson);
  }

  Future<void> removerMedicao(String token, int ensaioId, int id) async {
    await _requisitar(
      'DELETE',
      '/ensaios/$ensaioId/medicoes/$id',
      token: token,
    );
  }

  Future<List<Falha>> listarFalhas(String token, int ensaioId) async {
    final json = await _requisitar(
      'GET',
      '/ensaios/$ensaioId/falhas',
      token: token,
      consulta: {'tamanho': '100'},
    );
    return _dados(json, Falha.fromJson);
  }

  Future<Falha> registrarFalha(
    String token,
    int ensaioId, {
    required String descricao,
    required Severidade severidade,
    String? componente,
    double? horimetro,
  }) async {
    final json = await _requisitar(
      'POST',
      '/ensaios/$ensaioId/falhas',
      token: token,
      corpo: {
        'descricao': descricao,
        'severidade': severidade.api,
        'componente': ?componente,
        'horimetro': ?horimetro,
      },
    );
    return _objeto(json, Falha.fromJson);
  }

  Future<void> removerFalha(String token, int ensaioId, int id) async {
    await _requisitar('DELETE', '/ensaios/$ensaioId/falhas/$id', token: token);
  }

  // ---------------------------------------------------------------- 4.4

  Future<Avaliacao> buscarAvaliacao(String token, int ensaioId) async {
    return _objeto(
      await _requisitar('GET', '/ensaios/$ensaioId/avaliacao', token: token),
      Avaliacao.fromJson,
    );
  }

  /// PATCH parcial: só os campos do mapa mudam; null apaga o valor.
  Future<Avaliacao> salvarCampos(
    String token,
    int ensaioId,
    Map<String, Object?> campos,
  ) async {
    return _objeto(
      await _requisitar(
        'PATCH',
        '/ensaios/$ensaioId/avaliacao',
        token: token,
        corpo: campos,
      ),
      Avaliacao.fromJson,
    );
  }

  /// "Salvar ao avançar": um critério por vez.
  Future<Avaliacao> avaliarCriterio(
    String token,
    int ensaioId,
    String criterio, {
    required Parecer parecer,
    String? justificativa,
  }) async {
    return _objeto(
      await _requisitar(
        'PUT',
        '/ensaios/$ensaioId/avaliacao/criterios/$criterio',
        token: token,
        corpo: {
          'parecer': parecer.api,
          'justificativa': ?justificativa,
        },
      ),
      Avaliacao.fromJson,
    );
  }

  // ------------------------------------------------------------- apoio

  List<T> _dados<T>(Object? json, T Function(Map<String, dynamic>) deJson) {
    if (json is Map<String, dynamic> && json['dados'] is List) {
      try {
        return listaDeJson(json['dados'], deJson);
      } on FormatException {
        throw const RespostaInesperada();
      } on TypeError {
        throw const RespostaInesperada();
      }
    }
    throw const RespostaInesperada();
  }

  T _objeto<T>(Object? json, T Function(Map<String, dynamic>) deJson) {
    if (json is! Map<String, dynamic>) throw const RespostaInesperada();
    try {
      return deJson(json);
    } on FormatException {
      throw const RespostaInesperada();
    } on TypeError {
      throw const RespostaInesperada();
    }
  }

  /// Faz a chamada e traduz tudo o que pode dar errado em [FalhaDaApi].
  Future<Object?> _requisitar(
    String metodo,
    String caminho, {
    String? token,
    Map<String, String>? consulta,
    Map<String, Object?>? corpo,
  }) async {
    final url = base.replace(path: caminho, queryParameters: consulta);
    final requisicao = http.Request(metodo, url)
      ..headers['Accept'] = 'application/json';
    if (token != null) requisicao.headers['Authorization'] = 'Bearer $token';
    if (corpo != null) {
      // Sem Content-Type a API não lê o corpo e responde 400.
      requisicao.headers['Content-Type'] = 'application/json';
      requisicao.body = jsonEncode(corpo);
    }

    final http.Response resposta;
    try {
      resposta = await http.Response.fromStream(
        await _cliente.send(requisicao).timeout(limite),
      ).timeout(limite);
    } on TimeoutException {
      throw const TempoEsgotado();
    } on http.ClientException {
      // O IOClient do pacote http já embrulha SocketException nesta classe.
      throw const SemConexao();
    }

    final texto = utf8.decode(resposta.bodyBytes);
    Object? json;
    if (texto.isNotEmpty) {
      try {
        json = jsonDecode(texto);
      } on FormatException {
        throw const RespostaInesperada();
      }
    }

    if (resposta.statusCode < 200 || resposta.statusCode >= 300) {
      final detalhes = <String>[];
      if (json is Map<String, dynamic> && json['detalhes'] is List) {
        final lista = json['detalhes'] as List<dynamic>;
        detalhes.addAll(lista.map((d) => d.toString()));
      }
      throw ErroDaApi(resposta.statusCode, detalhes);
    }
    return json;
  }
}
