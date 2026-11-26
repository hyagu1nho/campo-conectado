import 'package:flutter/material.dart';

import '../formatos.dart';
import '../models/avaliacao.dart';
import '../models/enums.dart';
import '../services/api.dart';
import '../services/sessao.dart';
import '../validacao.dart';
import '../tema.dart';
import '../widgets/falhas.dart';
import '../widgets/painel.dart';

/// Avaliação da Pulverização. Uma tela, um botão: "Salvar avaliação" grava
/// as condições, os critérios e o parecer final de uma vez. Pode salvar
/// pela metade; o que falta aparece nas pendências, calculadas pela API.
class AvaliacaoScreen extends StatefulWidget {
  const AvaliacaoScreen({
    super.key,
    required this.ensaioId,
    required this.editavel,
    required this.api,
    required this.sessao,
  });

  final int ensaioId;
  final bool editavel;
  final ApiCampo api;
  final Sessao sessao;

  @override
  State<AvaliacaoScreen> createState() => _AvaliacaoScreenState();
}

class _AvaliacaoScreenState extends State<AvaliacaoScreen> {
  final _formulario = GlobalKey<FormState>();
  final _velocidade = TextEditingController();
  final _terreno = TextEditingController();
  final _horimetroInicial = TextEditingController();
  final _horimetroFinal = TextEditingController();
  final _capacidade = TextEditingController();
  final _concorrente = TextEditingController();
  final _justificativaFinal = TextEditingController();
  final _pareceres = <String, Parecer?>{};
  final _justificativas = <String, TextEditingController>{};
  ParecerFinal? _parecerFinal;

  Avaliacao? _avaliacao;
  FalhaDaApi? _falha;
  bool _preenchido = false;
  bool _salvando = false;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    for (final c in [
      _velocidade,
      _terreno,
      _horimetroInicial,
      _horimetroFinal,
      _capacidade,
      _concorrente,
      _justificativaFinal,
      ..._justificativas.values,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _carregar() async {
    final token = widget.sessao.token;
    if (token == null) return;
    try {
      final avaliacao = await widget.api.buscarAvaliacao(token, widget.ensaioId);
      if (!mounted) return;
      _preencher(avaliacao);
      setState(() => _avaliacao = avaliacao);
    } on FalhaDaApi catch (falha) {
      if (!mounted) return;
      setState(() => _falha = falha);
      if (falha is ErroDaApi && falha.status == 401) {
        avisarFalha(context, widget.sessao, falha);
      }
    }
  }

  /// Copia a avaliação para os campos só na primeira vez, para um
  /// salvamento não apagar o que o analista ainda está digitando.
  void _preencher(Avaliacao avaliacao) {
    if (_preenchido) return;
    _preenchido = true;
    String texto(double? valor) => valor == null ? '' : numero(valor);
    _velocidade.text = texto(avaliacao.velocidade);
    _terreno.text = avaliacao.terreno ?? '';
    _horimetroInicial.text = texto(avaliacao.horimetroInicial);
    _horimetroFinal.text = texto(avaliacao.horimetroFinal);
    _capacidade.text = texto(avaliacao.capacidadeOperacional);
    _concorrente.text = texto(avaliacao.capacidadeConcorrente);
    _parecerFinal = avaliacao.parecerFinal;
    _justificativaFinal.text = avaliacao.justificativaFinal ?? '';
    for (final c in avaliacao.criterios) {
      _pareceres[c.criterio] = c.parecer;
      _justificativas[c.criterio] = TextEditingController(
        text: c.justificativa ?? '',
      );
    }
  }

  String? _horimetroFinalValido(String? texto) {
    final erro = validarNumero(texto, obrigatorio: false, casas: 1, minimo: 0);
    if (erro != null) return erro;
    final inicial = lerNumero(_horimetroInicial.text);
    final finalLido = lerNumero(texto ?? '');
    if (inicial != null && finalLido != null && finalLido < inicial) {
      return 'O final deve ser maior ou igual ao inicial.';
    }
    return null;
  }

  /// Justificativa só vale quando o parecer não é "Conforme" / "Aprovada".
  String? _justificativaDe(bool exige, TextEditingController controle) =>
      exige ? textoOuNulo(controle.text) : null;

  /// Primeira justificativa que falta, ou null se está tudo certo.
  String? _conferirJustificativas(Avaliacao avaliacao) {
    for (final c in avaliacao.criterios) {
      final parecer = _pareceres[c.criterio];
      if (parecer != null &&
          parecer.exigeJustificativa &&
          textoOuNulo(_justificativas[c.criterio]!.text) == null) {
        return '${c.rotulo}: justifique quando o parecer não é Conforme.';
      }
    }
    final final_ = _parecerFinal;
    if (final_ != null &&
        final_.exigeJustificativa &&
        textoOuNulo(_justificativaFinal.text) == null) {
      return 'Parecer final: justifique quando não é Aprovada.';
    }
    return null;
  }

  Future<void> _salvar() async {
    final token = widget.sessao.token;
    final atual = _avaliacao;
    if (token == null || atual == null) return;
    if (!(_formulario.currentState?.validate() ?? false)) return;
    final erro = _conferirJustificativas(atual);
    if (erro != null) {
      setState(() => _erro = erro);
      return;
    }
    setState(() {
      _salvando = true;
      _erro = null;
    });
    try {
      final parecerFinal = _parecerFinal;
      var avaliacao = await widget.api.salvarCampos(token, widget.ensaioId, {
        'velocidade': lerNumero(_velocidade.text),
        'terreno': textoOuNulo(_terreno.text),
        'horimetroInicial': lerNumero(_horimetroInicial.text),
        'horimetroFinal': lerNumero(_horimetroFinal.text),
        'capacidadeOperacional': lerNumero(_capacidade.text),
        'capacidadeConcorrente': lerNumero(_concorrente.text),
        'parecerFinal': parecerFinal?.api,
        'justificativaFinal': parecerFinal == null
            ? null
            : _justificativaDe(
                parecerFinal.exigeJustificativa,
                _justificativaFinal,
              ),
      });
      for (final c in atual.criterios) {
        final parecer = _pareceres[c.criterio];
        if (parecer == null) continue;
        final justificativa = _justificativaDe(
          parecer.exigeJustificativa,
          _justificativas[c.criterio]!,
        );
        if (parecer == c.parecer && justificativa == c.justificativa) continue;
        avaliacao = await widget.api.avaliarCriterio(
          token,
          widget.ensaioId,
          c.criterio,
          parecer: parecer,
          justificativa: justificativa,
        );
      }
      if (!mounted) return;
      setState(() => _avaliacao = avaliacao);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Avaliação salva.')));
    } on FalhaDaApi catch (falha) {
      if (mounted) avisarFalha(context, widget.sessao, falha);
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final avaliacao = _avaliacao;
    final falha = _falha;
    return Scaffold(
      appBar: AppBar(title: const Text('Avaliação')),
      body: avaliacao == null
          ? (falha != null
                ? MensagemDeFalha(falha: falha, aoTentarDeNovo: _carregar)
                : const Center(child: CircularProgressIndicator()))
          : Form(
              key: _formulario,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _condicoes(),
                  const SizedBox(height: 16),
                  TituloSecao(
                    'Critérios',
                    complemento: TextoSuave(
                      '${avaliacao.avaliados} de ${avaliacao.criterios.length}',
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final criterio in avaliacao.criterios) ...[
                    _criterio(criterio),
                    const SizedBox(height: 12),
                  ],
                  const SizedBox(height: 4),
                  _parecerFinalCartao(),
                  const SizedBox(height: 16),
                  _Pendencias(pendencias: avaliacao.pendencias),
                ],
              ),
            ),
      bottomNavigationBar: avaliacao != null && widget.editavel
          ? RodapeDeAcao(
              apoio: _erro,
              child: FilledButton(
                onPressed: _salvando ? null : _salvar,
                child: Text(_salvando ? 'Salvando…' : 'Salvar avaliação'),
              ),
            )
          : null,
    );
  }

  Widget _numero(
    TextEditingController controle,
    String rotulo,
    String unidade,
    FormFieldValidator<String> validar,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RotuloCampo(rotulo),
          TextFormField(
            controller: controle,
            enabled: widget.editavel,
            decoration: InputDecoration(suffixText: unidade),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: validar,
          ),
        ],
      ),
    );
  }

  Widget _condicoes() {
    String? positivo2(String? t) =>
        validarNumero(t, obrigatorio: false, casas: 2, positivo: true);
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TituloSecao('Condições do ensaio'),
          _numero(_velocidade, 'Velocidade', 'km/h', positivo2),
          const SizedBox(height: 12),
          const RotuloCampo('Terreno'),
          TextFormField(
            controller: _terreno,
            enabled: widget.editavel,
            validator: (t) => validarTexto(t, obrigatorio: false, maximo: 120),
          ),
          _numero(
            _horimetroInicial,
            'Horímetro inicial',
            'h',
            (t) => validarNumero(t, obrigatorio: false, casas: 1, minimo: 0),
          ),
          _numero(_horimetroFinal, 'Horímetro final', 'h', _horimetroFinalValido),
          _numero(_capacidade, 'Capacidade operacional', 'ha/h', positivo2),
          _numero(_concorrente, 'Capacidade da concorrente', 'ha/h', positivo2),
        ],
      ),
    );
  }

  Widget _criterio(CriterioAvaliado criterio) {
    final parecer = _pareceres[criterio.criterio];
    return Painel(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            criterio.rotulo,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 8),
          EscolhaEmGrade<Parecer>(
            opcoes: Parecer.values,
            colunas: 3,
            rotulo: rotuloCurto,
            valor: parecer,
            cor: corDoParecer,
            habilitado: widget.editavel,
            aoEscolher: (p) => setState(() => _pareceres[criterio.criterio] = p),
          ),
          if (parecer != null && parecer.exigeJustificativa) ...[
            const SizedBox(height: 10),
            const RotuloCampo('Justificativa'),
            TextFormField(
              controller: _justificativas[criterio.criterio],
              enabled: widget.editavel,
              maxLines: 2,
            ),
          ],
        ],
      ),
    );
  }

  Widget _parecerFinalCartao() {
    final parecer = _parecerFinal;
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TituloSecao('Parecer final'),
          const SizedBox(height: 10),
          EscolhaEmGrade<ParecerFinal>(
            opcoes: ParecerFinal.values,
            colunas: 3,
            rotulo: (p) => switch (p) {
              ParecerFinal.aprovada => 'Aprovada',
              ParecerFinal.aprovadaComRessalva => 'Com ressalva',
              ParecerFinal.reprovada => 'Reprovada',
            },
            valor: parecer,
            cor: (p) => switch (p) {
              ParecerFinal.aprovada => Cores.verde,
              ParecerFinal.aprovadaComRessalva => Cores.amarelo,
              ParecerFinal.reprovada => Cores.vermelho,
            },
            habilitado: widget.editavel,
            aoEscolher: (p) => setState(() => _parecerFinal = p),
          ),
          if (parecer != null && parecer.exigeJustificativa) ...[
            const SizedBox(height: 10),
            const RotuloCampo('Justificativa'),
            TextFormField(
              controller: _justificativaFinal,
              enabled: widget.editavel,
              maxLines: 2,
            ),
          ],
        ],
      ),
    );
  }
}

class _Pendencias extends StatelessWidget {
  const _Pendencias({required this.pendencias});

  final List<String> pendencias;

  @override
  Widget build(BuildContext context) {
    if (pendencias.isEmpty) return const SizedBox.shrink();
    return Painel(
      faixaEsquerda: Cores.amarelo,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pendências',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: Cores.avisoTexto,
            ),
          ),
          const SizedBox(height: 4),
          for (final p in pendencias)
            Text(p, style: const TextStyle(color: Cores.avisoTexto)),
        ],
      ),
    );
  }
}

/// Rótulo curto do parecer, para caber em três colunas.
String rotuloCurto(Parecer parecer) => switch (parecer) {
  Parecer.conforme => 'Conforme',
  Parecer.conformeComRessalva => 'Com ressalva',
  Parecer.naoConforme => 'Não conforme',
};

Color corDoParecer(Parecer parecer) => switch (parecer) {
  Parecer.conforme => Cores.verde,
  Parecer.conformeComRessalva => Cores.amarelo,
  Parecer.naoConforme => Cores.vermelho,
};
