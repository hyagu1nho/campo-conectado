import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/login_screen.dart';
import 'package:mobile/services/sessao.dart';

import 'apoio.dart';

/// Substitui o teste do contador gerado pelo `flutter create`.
void main() {
  testWidgets('senha errada mostra a mensagem e não entra', (tester) async {
    final api = apiCom((req) async {
      return switch (req.url.path) {
        '/saude' => respostaJson({'status': 'ok', 'banco': 'ok'}),
        _ => respostaErro(401, ['e-mail ou senha inválidos']),
      };
    });
    final sessao = Sessao(api);

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(api: api, sessao: sessao)),
    );
    await tester.pumpAndSettle();
    // API no ar: o aviso de falha da API não aparece.
    expect(find.text('Conferir'), findsNothing);

    await tester.enterText(find.byType(TextFormField).at(0), 'analista@campo.dev');
    await tester.enterText(find.byType(TextFormField).at(1), 'errada');
    await tester.tap(find.text('Entrar').last);
    await tester.pumpAndSettle();

    expect(find.text('E-mail ou senha incorretos.'), findsOneWidget);
    expect(sessao.ativa, isFalse);
  });

  testWidgets('formulário vazio não chama a API', (tester) async {
    var chamadasDeLogin = 0;
    final api = apiCom((req) async {
      if (req.url.path == '/auth/login') chamadasDeLogin++;
      return respostaJson({'status': 'ok'});
    });

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(api: api, sessao: Sessao(api))),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Entrar').last);
    await tester.pumpAndSettle();

    expect(find.text('Informe um e-mail válido.'), findsOneWidget);
    expect(chamadasDeLogin, 0);
  });
}
