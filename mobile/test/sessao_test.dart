import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/sessao.dart';

import 'apoio.dart';

void main() {
  test('analista entra e o token fica só em memória', () async {
    final api = apiCom((req) async {
      return switch (req.url.path) {
        '/auth/login' => respostaJson({'accessToken': 'tk'}),
        '/auth/perfil' => respostaJson({'id': 5, 'perfil': 'ANALISTA'}),
        _ => respostaErro(404, []),
      };
    });
    final sessao = Sessao(api);
    var avisos = 0;
    sessao.addListener(() => avisos++);

    await sessao.entrar(email: 'analista@campo.dev', senha: 'x');

    expect(sessao.ativa, isTrue);
    expect(sessao.token, 'tk');
    expect(sessao.usuarioId, 5);
    expect(avisos, 1);

    sessao.sair();
    expect(sessao.ativa, isFalse);
    expect(avisos, 2);
  });

  test('engenheiro é recusado e não fica com sessão', () async {
    final api = apiCom((req) async {
      return switch (req.url.path) {
        '/auth/login' => respostaJson({'accessToken': 'tk'}),
        _ => respostaJson({'id': 4, 'perfil': 'ENGENHEIRO'}),
      };
    });
    final sessao = Sessao(api);

    await expectLater(
      sessao.entrar(email: 'engenheiro@campo.dev', senha: 'x'),
      throwsA(isA<PerfilNaoAceito>()),
    );
    expect(sessao.ativa, isFalse);
  });
}
