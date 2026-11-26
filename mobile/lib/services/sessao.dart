import 'package:flutter/foundation.dart';

import 'api.dart';

/// O web é do engenheiro; o app é do analista.
class PerfilNaoAceito implements Exception {
  const PerfilNaoAceito();
}

/// Sessão no nível **Simplificada**: login real contra a API, mas o token fica
/// só em memória. Fechar o app encerra a sessão; não há renovação. Quando a
/// API responde 401 (token vencido, 1 hora), o app volta ao login.
/// Nenhuma rota da API foi afrouxada por causa disso.
class Sessao extends ChangeNotifier {
  Sessao(this._api);

  final ApiCampo _api;
  String? _token;
  int? _usuarioId;

  String? get token => _token;
  int? get usuarioId => _usuarioId;
  bool get ativa => _token != null;

  /// Lança [FalhaDaApi] (ex.: 401 por senha errada) ou [PerfilNaoAceito].
  /// O token só é guardado depois de confirmar que é um analista.
  Future<void> entrar({required String email, required String senha}) async {
    final token = await _api.entrar(email: email, senha: senha);
    final perfil = await _api.perfil(token);
    if (perfil.perfil != 'ANALISTA') throw const PerfilNaoAceito();
    _token = token;
    _usuarioId = perfil.id;
    notifyListeners();
  }

  void sair() {
    if (_token == null) return;
    _token = null;
    _usuarioId = null;
    notifyListeners();
  }
}
