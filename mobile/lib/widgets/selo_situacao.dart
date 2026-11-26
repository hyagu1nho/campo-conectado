import 'package:flutter/material.dart';

import '../models/enums.dart';
import '../tema.dart';

/// Etiqueta arredondada com fundo claro e texto escuro do mesmo tom.
class Selo extends StatelessWidget {
  const Selo({
    super.key,
    required this.texto,
    required this.fundo,
    required this.cor,
  });

  final String texto;
  final Color fundo;
  final Color cor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(
        color: fundo,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        texto,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: cor,
        ),
      ),
    );
  }
}

class SeloSituacao extends StatelessWidget {
  const SeloSituacao({super.key, required this.situacao});

  final Situacao situacao;

  @override
  Widget build(BuildContext context) {
    final (fundo, cor) = switch (situacao) {
      Situacao.planejado => (Cores.neutroFundo, Cores.neutroTexto),
      Situacao.emAndamento => (Cores.infoFundo, Cores.infoTexto),
      Situacao.enviado => (Cores.avisoFundo, Cores.avisoTexto),
      Situacao.devolvido => (Cores.perigoFundo, Cores.perigoTexto),
      Situacao.concluido => (Cores.sucessoFundo, Cores.sucessoTexto),
    };
    return Selo(texto: situacao.rotulo, fundo: fundo, cor: cor);
  }
}
