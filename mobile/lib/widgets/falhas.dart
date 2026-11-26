import 'package:flutter/material.dart';

import '../services/api.dart';
import '../services/sessao.dart';

/// Mostra a falha num SnackBar. Em 401 (token vencido) encerra a sessão e
/// volta à primeira tela, que passa a ser o login.
void avisarFalha(BuildContext context, Sessao sessao, FalhaDaApi falha) {
  final mensageiro = ScaffoldMessenger.of(context);
  if (falha is ErroDaApi && falha.status == 401) {
    Navigator.of(context).popUntil((rota) => rota.isFirst);
    sessao.sair();
  }
  mensageiro.showSnackBar(SnackBar(content: Text(descreverFalha(falha))));
}

/// Falha no lugar do conteúdo, com botão para tentar de novo.
class MensagemDeFalha extends StatelessWidget {
  const MensagemDeFalha({
    super.key,
    required this.falha,
    required this.aoTentarDeNovo,
  });

  final FalhaDaApi falha;
  final VoidCallback aoTentarDeNovo;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(descreverFalha(falha), textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: aoTentarDeNovo,
              child: const Text('Tentar de novo'),
            ),
          ],
        ),
      ),
    );
  }
}
