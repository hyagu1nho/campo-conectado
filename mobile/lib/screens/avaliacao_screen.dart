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

/// Avaliação da Pulverização. O analista preenche aos poucos: as condições
/// do ensaio, um critério por vez ("salvar ao avançar") e o parecer final.
/// As evidências e as pendências vêm calculadas pela API a cada resposta.
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
  Avaliacao? _avaliacao;
  FalhaDaApi? _falha;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final token = widget.sessao.token;
    if (token == null) return;
    try {
      final avaliacao = await widget.api.buscarAvaliacao(token, widget.ensaioId);
      if (mounted) setState(() => _avaliacao = avaliacao);
    } on FalhaDaApi catch (falha) {
      if (!mounted) return;
      setState(() => _falha = falha);
      if (falha is ErroDaApi && falha.status == 401) {
        avisarFalha(context, widget.sessao, falha);
      }
    }
  }

  /// Executa um salvamento; a resposta da API já é a avaliação atualizada.
  /// Devolve true se gravou.
  Future<bool> _salvar(
    Future<Avaliacao> Function(String token) salvar,
    String mensagem,
  ) async {
    final token = widget.sessao.token;
    if (token == null) return false;
    try {
      final avaliacao = await salvar(token);
      if (!mounted) return true;
      setState(() => _avaliacao = avaliacao);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(mensagem)));
      return true;
    } on FalhaDaApi catch (falha) {
      if (mounted) avisarFalha(context, widget.sessao, falha);
      return false;
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
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _Condicoes(
                  avaliacao: avaliacao,
                  editavel: widget.editavel,
                  aoSalvar: (campos) => _salvar(
                    (t) => widget.api.salvarCampos(t, widget.ensaioId, campos),
                    'Condições salvas.',
                  ),
                ),
                const SizedBox(height: 16),
                TituloSecao(
                  'Critérios',
                  complemento: TextoSuave(
                    '${avaliacao.avaliados} de ${avaliacao.criterios.length}',
                  ),
                ),
                const SizedBox(height: 8),
                for (final criterio in avaliacao.criterios) ...[
                  _CartaoCriterio(
                    key: ValueKey(criterio.criterio),
                    criterio: criterio,
                    editavel: widget.editavel,
                    aoSalvar: (parecer, justificativa) => _salvar(
                      (t) => widget.api.avaliarCriterio(
                        t,
                        widget.ensaioId,
                        criterio.criterio,
                        parecer: parecer,
                        justificativa: justificativa,
                      ),
                      '${criterio.rotulo}: salvo.',
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                const SizedBox(height: 4),
                _ParecerFinal(
                  avaliacao: avaliacao,
                  editavel: widget.editavel,
                  aoSalvar: (parecer, justificativa) => _salvar(
                    (t) => widget.api.salvarCampos(t, widget.ensaioId, {
                      'parecerFinal': parecer.api,
                      'justificativaFinal': justificativa,
                    }),
                    'Parecer final salvo.',
                  ),
                ),
                const SizedBox(height: 16),
                _Pendencias(pendencias: avaliacao.pendencias),
              ],
            ),
    );
  }
}

/// Campos objetivos do ensaio. Salva tudo de uma vez; vazio apaga.
class _Condicoes extends StatefulWidget {
  const _Condicoes({
    required this.avaliacao,
    required this.editavel,
    required this.aoSalvar,
  });

  final Avaliacao avaliacao;
  final bool editavel;
  final Future<bool> Function(Map<String, Object?> campos) aoSalvar;

  @override
  State<_Condicoes> createState() => _CondicoesState();
}

class _CondicoesState extends State<_Condicoes> {
  final _formulario = GlobalKey<FormState>();
  late final _velocidade = _campo(widget.avaliacao.velocidade);
  late final _terreno = TextEditingController(
    text: widget.avaliacao.terreno ?? '',
  );
  late final _horimetroInicial = _campo(widget.avaliacao.horimetroInicial);
  late final _horimetroFinal = _campo(widget.avaliacao.horimetroFinal);
  late final _capacidade = _campo(widget.avaliacao.capacidadeOperacional);
  late final _concorrente = _campo(widget.avaliacao.capacidadeConcorrente);
  bool _salvando = false;

  static TextEditingController _campo(double? valor) =>
      TextEditingController(text: valor == null ? '' : numero(valor));

  @override
  void dispose() {
    for (final c in [
      _velocidade,
      _terreno,
      _horimetroInicial,
      _horimetroFinal,
      _capacidade,
      _concorrente,
    ]) {
      c.dispose();
    }
    super.dispose();
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

  Future<void> _salvar() async {
    final formulario = _formulario.currentState;
    if (formulario == null || !formulario.validate()) return;
    setState(() => _salvando = true);
    await widget.aoSalvar({
      'velocidade': lerNumero(_velocidade.text),
      'terreno': textoOuNulo(_terreno.text),
      'horimetroInicial': lerNumero(_horimetroInicial.text),
      'horimetroFinal': lerNumero(_horimetroFinal.text),
      'capacidadeOperacional': lerNumero(_capacidade.text),
      'capacidadeConcorrente': lerNumero(_concorrente.text),
    });
    if (mounted) setState(() => _salvando = false);
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

  @override
  Widget build(BuildContext context) {
    String? positivo2(String? t) =>
        validarNumero(t, obrigatorio: false, casas: 2, positivo: true);
    return Painel(
      child: Form(
      key: _formulario,
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
          if (widget.editavel) ...[
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _salvando ? null : _salvar,
              child: Text(_salvando ? 'Salvando…' : 'Salvar condições'),
            ),
          ],
        ],
      ),
      ),
    );
  }
}

/// Um critério: parecer e, quando não é "Conforme", justificativa.
class _CartaoCriterio extends StatefulWidget {
  const _CartaoCriterio({
    super.key,
    required this.criterio,
    required this.editavel,
    required this.aoSalvar,
  });

  final CriterioAvaliado criterio;
  final bool editavel;
  final Future<bool> Function(Parecer parecer, String? justificativa) aoSalvar;

  @override
  State<_CartaoCriterio> createState() => _CartaoCriterioState();
}

class _CartaoCriterioState extends State<_CartaoCriterio> {
  late Parecer? _parecer = widget.criterio.parecer;
  late final _justificativa = TextEditingController(
    text: widget.criterio.justificativa ?? '',
  );
  bool _salvando = false;
  String? _erro;

  @override
  void dispose() {
    _justificativa.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    final parecer = _parecer;
    if (parecer == null) {
      setState(() => _erro = 'Escolha o parecer.');
      return;
    }
    final justificativa = textoOuNulo(_justificativa.text);
    if (parecer.exigeJustificativa && justificativa == null) {
      setState(() => _erro = 'Justifique quando o parecer não é Conforme.');
      return;
    }
    setState(() {
      _salvando = true;
      _erro = null;
    });
    await widget.aoSalvar(parecer, justificativa);
    if (mounted) setState(() => _salvando = false);
  }

  @override
  Widget build(BuildContext context) {
    final erro = _erro;
    final parecer = _parecer;
    return Painel(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.criterio.rotulo,
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
              aoEscolher: (p) => setState(() => _parecer = p),
            ),
            if (parecer != null && parecer.exigeJustificativa) ...[
              const SizedBox(height: 10),
              const RotuloCampo('Justificativa'),
              TextFormField(
                controller: _justificativa,
                enabled: widget.editavel,
                maxLines: 2,
              ),
            ],
            if (erro != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  erro,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            if (widget.editavel)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _salvando ? null : _salvar,
                  child: Text(_salvando ? 'Salvando…' : 'Salvar critério'),
                ),
              ),
          ],
      ),
    );
  }
}

class _ParecerFinal extends StatefulWidget {
  const _ParecerFinal({
    required this.avaliacao,
    required this.editavel,
    required this.aoSalvar,
  });

  final Avaliacao avaliacao;
  final bool editavel;
  final Future<bool> Function(ParecerFinal parecer, String? justificativa)
  aoSalvar;

  @override
  State<_ParecerFinal> createState() => _ParecerFinalState();
}

class _ParecerFinalState extends State<_ParecerFinal> {
  late ParecerFinal? _parecer = widget.avaliacao.parecerFinal;
  late final _justificativa = TextEditingController(
    text: widget.avaliacao.justificativaFinal ?? '',
  );
  bool _salvando = false;
  String? _erro;

  @override
  void dispose() {
    _justificativa.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    final parecer = _parecer;
    if (parecer == null) {
      setState(() => _erro = 'Escolha o parecer final.');
      return;
    }
    final justificativa = textoOuNulo(_justificativa.text);
    if (parecer.exigeJustificativa && justificativa == null) {
      setState(() => _erro = 'Justifique quando não é Aprovada.');
      return;
    }
    setState(() {
      _salvando = true;
      _erro = null;
    });
    await widget.aoSalvar(parecer, justificativa);
    if (mounted) setState(() => _salvando = false);
  }

  @override
  Widget build(BuildContext context) {
    final erro = _erro;
    final parecer = _parecer;
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
          aoEscolher: (p) => setState(() => _parecer = p),
        ),
        if (parecer != null && parecer.exigeJustificativa) ...[
          const SizedBox(height: 10),
          const RotuloCampo('Justificativa'),
          TextFormField(
            controller: _justificativa,
            enabled: widget.editavel,
            maxLines: 2,
          ),
        ],
        if (erro != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              erro,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        if (widget.editavel) ...[
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _salvando ? null : _salvar,
            child: Text(_salvando ? 'Salvando…' : 'Salvar parecer final'),
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
