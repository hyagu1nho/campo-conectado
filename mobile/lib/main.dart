import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'screens/meus_ensaios_screen.dart';
import 'services/api.dart';
import 'services/config.dart';
import 'services/sessao.dart';
import 'tema.dart';

void main() {
  // Estado do app criado uma vez, acima do Navigator, e passado por construtor.
  final api = ApiCampo(base: Uri.parse(enderecoDaApi));
  final sessao = Sessao(api);
  runApp(CampoConectadoApp(api: api, sessao: sessao));
}

class CampoConectadoApp extends StatelessWidget {
  const CampoConectadoApp({super.key, required this.api, required this.sessao});

  final ApiCampo api;
  final Sessao sessao;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Campo Conectado',
      theme: temaCampo(),
      // Sem sessão, a primeira tela é o login; com sessão, os meus ensaios.
      home: ListenableBuilder(
        listenable: sessao,
        builder: (context, _) => sessao.ativa
            ? MeusEnsaiosScreen(api: api, sessao: sessao)
            : LoginScreen(api: api, sessao: sessao),
      ),
    );
  }
}
