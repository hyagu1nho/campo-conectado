import 'package:flutter/material.dart';

import '../services/api.dart';
import '../services/config.dart';
import '../tema.dart';

/// Primeira chamada do app à API (GET /saude), na tela de login. Só aparece
/// quando a API não responde, com o endereço usado e um botão para conferir.
class SituacaoDaApi extends StatefulWidget {
  const SituacaoDaApi({super.key, required this.api});

  final ApiCampo api;

  @override
  State<SituacaoDaApi> createState() => _SituacaoDaApiState();
}

class _SituacaoDaApiState extends State<SituacaoDaApi> {
  // Criado uma vez, nunca dentro do build.
  late Future<bool> _saude = widget.api.saude();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _saude,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done ||
            snapshot.data == true) {
          return const SizedBox.shrink();
        }
        final erro = snapshot.error;
        final texto = erro is FalhaDaApi
            ? descreverFalha(erro)
            : 'API indisponível.';
        return Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
          decoration: const BoxDecoration(
            color: Cores.perigoFundo,
            border: Border(left: BorderSide(color: Cores.vermelho, width: 4)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(texto, style: const TextStyle(color: Cores.perigoTexto)),
                    Text(
                      enderecoDaApi,
                      style: const TextStyle(color: Cores.suave, fontSize: 12),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => setState(() {
                  _saude = widget.api.saude();
                }),
                child: const Text('Conferir'),
              ),
            ],
          ),
        );
      },
    );
  }
}
