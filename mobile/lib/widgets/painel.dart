import 'package:flutter/material.dart';

import '../tema.dart';

/// Bloco de conteúdo: papel sobre o aço, borda fina e raio de 8.
class Painel extends StatelessWidget {
  const Painel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.corDaBorda = Cores.linha,
    this.larguraDaBorda = 1,
    this.faixaEsquerda,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color corDaBorda;
  final double larguraDaBorda;

  /// Faixa colorida à esquerda (ex.: vermelho no ensaio devolvido).
  final Color? faixaEsquerda;

  @override
  Widget build(BuildContext context) {
    final faixa = faixaEsquerda;
    return Container(
      decoration: BoxDecoration(
        color: Cores.papel,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: corDaBorda, width: larguraDaBorda),
      ),
      clipBehavior: Clip.antiAlias,
      child: faixa == null
          ? Padding(padding: padding, child: child)
          : IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: faixa),
                  Expanded(
                    child: Padding(padding: padding, child: child),
                  ),
                ],
              ),
            ),
    );
  }
}

/// Título de seção com um complemento à direita (contagem, selo).
class TituloSecao extends StatelessWidget {
  const TituloSecao(this.texto, {super.key, this.complemento});

  final String texto;
  final Widget? complemento;

  @override
  Widget build(BuildContext context) {
    final extra = complemento;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Text(
            texto,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
          ),
        ),
        if (extra != null) extra,
      ],
    );
  }
}

/// Texto de apoio em cinza.
class TextoSuave extends StatelessWidget {
  const TextoSuave(this.texto, {super.key, this.tamanho = 14});

  final String texto;
  final double tamanho;

  @override
  Widget build(BuildContext context) {
    return Text(
      texto,
      style: TextStyle(color: Cores.suave, fontSize: tamanho),
    );
  }
}

/// Marca do produto: o medidor em fundo verde.
class Marca extends StatelessWidget {
  const Marca({super.key, this.tamanho = 28});

  final double tamanho;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: tamanho,
      height: tamanho,
      decoration: BoxDecoration(
        color: Cores.verde,
        borderRadius: BorderRadius.circular(tamanho * 0.23),
      ),
      child: Icon(Icons.speed, color: Colors.white, size: tamanho * 0.7),
    );
  }
}

/// Barra fixa embaixo da tela com o botão principal.
class RodapeDeAcao extends StatelessWidget {
  const RodapeDeAcao({super.key, required this.child, this.apoio});

  final Widget child;
  final String? apoio;

  @override
  Widget build(BuildContext context) {
    final texto = apoio;
    return Container(
      decoration: const BoxDecoration(
        color: Cores.papel,
        border: Border(top: BorderSide(color: Cores.linha)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            child,
            if (texto != null) ...[
              const SizedBox(height: 6),
              Text(
                texto,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Cores.suave, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Grade de opções em que só uma fica marcada, com borda verde (ou da cor
/// pedida) na escolhida. Usada para grandeza, severidade e parecer.
class EscolhaEmGrade<T> extends StatelessWidget {
  const EscolhaEmGrade({
    super.key,
    required this.opcoes,
    required this.rotulo,
    required this.valor,
    required this.aoEscolher,
    this.colunas = 2,
    this.cor,
    this.habilitado = true,
  });

  final List<T> opcoes;
  final String Function(T) rotulo;
  final T? valor;
  final ValueChanged<T> aoEscolher;
  final int colunas;
  final Color Function(T)? cor;
  final bool habilitado;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, restricoes) {
        const espaco = 8.0;
        final largura =
            (restricoes.maxWidth - espaco * (colunas - 1)) / colunas;
        return Wrap(
          spacing: espaco,
          runSpacing: espaco,
          children: [
            for (final opcao in opcoes)
              SizedBox(
                width: largura,
                child: _Opcao(
                  texto: rotulo(opcao),
                  marcada: opcao == valor,
                  cor: cor?.call(opcao) ?? Cores.verde,
                  aoTocar: habilitado ? () => aoEscolher(opcao) : null,
                ),
              ),
          ],
        );
      },
    );
  }
}

class _Opcao extends StatelessWidget {
  const _Opcao({
    required this.texto,
    required this.marcada,
    required this.cor,
    required this.aoTocar,
  });

  final String texto;
  final bool marcada;
  final Color cor;
  final VoidCallback? aoTocar;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: marcada,
      button: true,
      child: Material(
        color: Cores.papel,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
          side: BorderSide(
            color: marcada ? cor : Cores.linhaForte,
            width: marcada ? 2 : 1,
          ),
        ),
        child: InkWell(
          onTap: aoTocar,
          borderRadius: BorderRadius.circular(4),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                child: Text(
                  texto,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: marcada ? FontWeight.w600 : FontWeight.w400,
                    color: Cores.grafite,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Rótulo acima do campo, no lugar do rótulo flutuante do Material.
class RotuloCampo extends StatelessWidget {
  const RotuloCampo(this.texto, {super.key, this.opcional = false});

  final String texto;
  final bool opcional;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text.rich(
        TextSpan(
          text: texto,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          children: [
            if (opcional)
              const TextSpan(
                text: ' (opcional)',
                style: TextStyle(
                  fontWeight: FontWeight.w400,
                  color: Cores.suave,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
