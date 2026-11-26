import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../formatos.dart';
import '../models/avaliacao.dart';
import '../models/ensaio.dart';
import '../models/enums.dart';
import '../models/registros.dart';
import '../services/api.dart';
import '../services/sessao.dart';
import '../tema.dart';
import '../widgets/falhas.dart';
import '../widgets/painel.dart';
import '../widgets/selo_situacao.dart';
import 'avaliacao_screen.dart';
import 'nova_falha_screen.dart';
import 'nova_medicao_screen.dart';

/// CU-M2: o ensaio do analista, com o que já foi registrado, o que falta e
/// os botões para registrar, avaliar e enviar.
class EnsaioScreen extends StatefulWidget {
  const EnsaioScreen({
    super.key,
    required this.ensaioId,
    required this.api,
    required this.sessao,
  });

  final int ensaioId;
  final ApiCampo api;
  final Sessao sessao;

  @override
  State<EnsaioScreen> createState() => _EnsaioScreenState();
}

class _EnsaioScreenState extends State<EnsaioScreen> {
  Ensaio? _ensaio;
  List<Medicao> _medicoes = const [];
  List<Falha> _falhas = const [];
  List<String> _pendencias = const [];
  Avaliacao? _avaliacao;
  FalhaDaApi? _falha;
  bool _carregando = false;
  bool _enviando = false;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final token = widget.sessao.token;
    if (token == null || _carregando) return;
    setState(() => _carregando = true);
    try {
      final id = widget.ensaioId;
      final ensaio = await widget.api.buscarEnsaio(token, id);
      final medicoes = await widget.api.listarMedicoes(token, id);
      final falhas = await widget.api.listarFalhas(token, id);
      final pendencias = ensaio.situacao == Situacao.concluido
          ? const <String>[]
          : await widget.api.pendencias(token, id);
      // A avaliação (e as leituras calculadas) só existe na Pulverização.
      final avaliacao = ensaio.linha == Linha.pulverizacao
          ? await widget.api.buscarAvaliacao(token, id)
          : null;
      if (!mounted) return;
      setState(() {
        _ensaio = ensaio;
        _medicoes = medicoes;
        _falhas = falhas;
        _pendencias = pendencias;
        _avaliacao = avaliacao;
        _falha = null;
      });
    } on FalhaDaApi catch (falha) {
      if (!mounted) return;
      setState(() => _falha = falha);
      if (falha is ErroDaApi && falha.status == 401) {
        avisarFalha(context, widget.sessao, falha);
      }
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  /// Abre uma tela de registro e recarrega ao voltar: o voltar do Android não
  /// devolve resultado, e o primeiro registro pode ter iniciado o ensaio.
  Future<void> _registrar(Widget tela) async {
    await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => tela),
    );
    if (mounted) await _carregar();
  }

  Future<void> _remover({
    required String descricao,
    required Future<void> Function(String token) remover,
  }) async {
    final confirmou = await showDialog<bool>(
      context: context,
      builder: (contexto) => AlertDialog(
        title: const Text('Remover registro?'),
        content: Text(descricao),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(contexto, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Cores.vermelho),
            onPressed: () => Navigator.pop(contexto, true),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
    final token = widget.sessao.token;
    if (confirmou != true || token == null || !mounted) return;
    try {
      await remover(token);
      if (mounted) await _carregar();
    } on FalhaDaApi catch (falha) {
      if (mounted) avisarFalha(context, widget.sessao, falha);
    }
  }

  Future<void> _enviar() async {
    final token = widget.sessao.token;
    if (token == null) return;
    setState(() => _enviando = true);
    try {
      await widget.api.enviar(token, widget.ensaioId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ensaio enviado ao engenheiro.')),
      );
      await _carregar();
    } on FalhaDaApi catch (falha) {
      if (mounted) avisarFalha(context, widget.sessao, falha);
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ensaio = _ensaio;
    final falha = _falha;
    return Scaffold(
      appBar: AppBar(title: const Text('Ensaio')),
      body: ensaio == null
          ? (falha != null
                ? MensagemDeFalha(falha: falha, aoTentarDeNovo: _carregar)
                : const Center(child: CircularProgressIndicator()))
          : RefreshIndicator(
              onRefresh: _carregar,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                children: _conteudo(ensaio),
              ),
            ),
      bottomNavigationBar: ensaio != null && ensaio.situacao.aceitaRegistros
          ? _rodape(ensaio)
          : null,
    );
  }

  Widget _rodape(Ensaio ensaio) {
    // A API confere tudo de novo no envio; o botão só evita um 400 certo.
    final pode =
        ensaio.situacao.podeEnviar && _pendencias.isEmpty && !_enviando;
    return RodapeDeAcao(
      apoio: _pendencias.isEmpty ? null : _pendencias.join('\n'),
      child: FilledButton(
        onPressed: pode ? _enviar : null,
        child: Text(_enviando ? 'Enviando…' : 'Enviar ao engenheiro'),
      ),
    );
  }

  List<Widget> _conteudo(Ensaio ensaio) {
    final editavel = ensaio.situacao.aceitaRegistros;
    final avaliacao = _avaliacao;
    const espaco = SizedBox(height: 16);
    return [
      Align(
        alignment: Alignment.centerLeft,
        child: SeloSituacao(situacao: ensaio.situacao),
      ),
      const SizedBox(height: 10),
      Text(
        ensaio.objetivo,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          height: 1.2,
          letterSpacing: -0.3,
        ),
      ),
      const SizedBox(height: 8),
      Text(
        '${ensaio.maquina}, ${ensaio.numeroSerie}',
        style: const TextStyle(fontSize: 14),
      ),
      TextoSuave('${dataBrasileira(ensaio.dataPrevista)}, ${ensaio.area}'),

      // Devolução mais recente: o que o engenheiro pediu para corrigir.
      if (ensaio.situacao == Situacao.devolvido &&
          ensaio.devolucoes.isNotEmpty) ...[
        espaco,
        _Devolucao(devolucao: ensaio.devolucoes.first),
      ],

      if (avaliacao != null) ...[espaco, _Leituras(avaliacao: avaliacao)],

      espaco,
      _Medicoes(
        medicoes: _medicoes,
        aoRemover: editavel
            ? (m) => _remover(
                descricao:
                    '${m.grandeza.rotulo}: ${numero(m.valor, m.grandeza.unidade)}',
                remover: (t) => widget.api.removerMedicao(t, ensaio.id, m.id),
              )
            : null,
        aoNova: editavel
            ? () => _registrar(
                NovaMedicaoScreen(
                  ensaioId: ensaio.id,
                  api: widget.api,
                  sessao: widget.sessao,
                ),
              )
            : null,
      ),

      espaco,
      _Falhas(
        falhas: _falhas,
        aoRemover: editavel
            ? (f) => _remover(
                descricao: f.descricao,
                remover: (t) => widget.api.removerFalha(t, ensaio.id, f.id),
              )
            : null,
        aoNova: editavel
            ? () => _registrar(
                NovaFalhaScreen(
                  ensaioId: ensaio.id,
                  api: widget.api,
                  sessao: widget.sessao,
                ),
              )
            : null,
      ),

      if (avaliacao != null) ...[
        espaco,
        Painel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TituloSecao(
                'Avaliação',
                complemento: avaliacao.avaliados == avaliacao.criterios.length
                    ? Selo(
                        texto:
                            '${avaliacao.avaliados} de ${avaliacao.criterios.length}',
                        fundo: Cores.sucessoFundo,
                        cor: Cores.sucessoTexto,
                      )
                    : const Selo(
                        texto: 'Pendente',
                        fundo: Cores.avisoFundo,
                        cor: Cores.avisoTexto,
                      ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => _registrar(
                  AvaliacaoScreen(
                    ensaioId: ensaio.id,
                    editavel: editavel,
                    api: widget.api,
                    sessao: widget.sessao,
                  ),
                ),
                child: Text(editavel ? 'Avaliar' : 'Ver avaliação'),
              ),
            ],
          ),
        ),
      ],
      const SizedBox(height: 8),
    ];
  }
}

class _Devolucao extends StatelessWidget {
  const _Devolucao({required this.devolucao});

  final Devolucao devolucao;

  @override
  Widget build(BuildContext context) {
    return Painel(
      faixaEsquerda: Cores.vermelho,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Devolvido pelo engenheiro',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(devolucao.comentario),
          const SizedBox(height: 4),
          TextoSuave(
            '${devolucao.autor}, ${dataHora(devolucao.criadoEm)}',
            tamanho: 13,
          ),
        ],
      ),
    );
  }
}

/// Régua da temperatura: a barra vai até a maior medição e o traço escuro
/// marca o limite da ficha. Acima do limite, tudo em vermelho.
class _Regua extends StatelessWidget {
  const _Regua({required this.rotulo, required this.temperatura});

  final String rotulo;
  final Temperatura temperatura;

  @override
  Widget build(BuildContext context) {
    final maxima = temperatura.maxima;
    final limite = temperatura.limite;
    final acima = temperatura.excedeu == true;
    final escala = math.max(maxima ?? 0.0, limite ?? 0.0) * 1.2;
    double fracao(double v) => escala == 0 ? 0.0 : math.min(1.0, v / escala);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: Text(rotulo, style: const TextStyle(fontSize: 14))),
            Text(
              numero(maxima, '°C'),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: acima ? Cores.vermelho : Cores.grafite,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 18,
          child: LayoutBuilder(
            builder: (context, restricoes) {
              final largura = restricoes.maxWidth;
              return Stack(
                children: [
                  Positioned(
                    left: 0,
                    right: 0,
                    top: 4,
                    height: 10,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Cores.linhaFina,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  if (maxima != null)
                    Positioned(
                      left: 0,
                      top: 4,
                      height: 10,
                      width: largura * fracao(maxima),
                      child: Container(
                        decoration: BoxDecoration(
                          color: acima ? Cores.vermelho : Cores.verde,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  if (limite != null)
                    Positioned(
                      left: largura * fracao(limite) - 1,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      child: Container(color: Cores.grafite),
                    ),
                ],
              );
            },
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextoSuave('limite ${numero(limite, '°C')}', tamanho: 12),
        ),
      ],
    );
  }
}

class _Leituras extends StatelessWidget {
  const _Leituras({required this.avaliacao});

  final Avaliacao avaliacao;

  @override
  Widget build(BuildContext context) {
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TituloSecao('Leituras'),
          const SizedBox(height: 12),
          _Regua(
            rotulo: 'Temperatura do motor',
            temperatura: avaliacao.temperaturaMotor,
          ),
          const SizedBox(height: 12),
          _Regua(
            rotulo: 'Temperatura do hidráulico',
            temperatura: avaliacao.temperaturaHidraulico,
          ),
        ],
      ),
    );
  }
}

class _Medicoes extends StatelessWidget {
  const _Medicoes({
    required this.medicoes,
    required this.aoRemover,
    required this.aoNova,
  });

  final List<Medicao> medicoes;
  final void Function(Medicao)? aoRemover;
  final VoidCallback? aoNova;

  @override
  Widget build(BuildContext context) {
    final medidas = {for (final m in medicoes) m.grandeza};
    final remover = aoRemover;
    final nova = aoNova;
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TituloSecao(
            'Medições',
            complemento: TextoSuave(
              '${medidas.length} de ${Grandeza.values.length} grandezas',
            ),
          ),
          const SizedBox(height: 8),
          for (final g in Grandeza.values)
            _LinhaGrandeza(
              grandeza: g,
              maxima: medicoes
                  .where((m) => m.grandeza == g)
                  .map((m) => m.valor)
                  .fold<double?>(
                    null,
                    (maior, v) => maior == null || v > maior ? v : maior,
                  ),
            ),
          if (medicoes.isNotEmpty)
            Theme(
              data: Theme.of(
                context,
              ).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                childrenPadding: EdgeInsets.zero,
                title: Text(
                  medicoes.length == 1
                      ? 'Ver a medição'
                      : 'Ver as ${medicoes.length} medições',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Cores.verde,
                  ),
                ),
                children: [
                  for (final m in medicoes)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      title: Text(
                        '${m.grandeza.rotulo}: ${numero(m.valor, m.grandeza.unidade)}',
                      ),
                      subtitle: Text(
                        [
                          dataHora(m.registradaEm),
                          if (m.horimetro != null) numero(m.horimetro, 'h'),
                          if (m.observacao != null) m.observacao,
                        ].join(', '),
                      ),
                      trailing: remover == null
                          ? null
                          : IconButton(
                              tooltip: 'Remover medição',
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () => remover(m),
                            ),
                    ),
                ],
              ),
            ),
          if (nova != null) ...[
            const SizedBox(height: 8),
            OutlinedButton(onPressed: nova, child: const Text('Nova medição')),
          ],
        ],
      ),
    );
  }
}

class _LinhaGrandeza extends StatelessWidget {
  const _LinhaGrandeza({required this.grandeza, required this.maxima});

  final Grandeza grandeza;
  final double? maxima;

  @override
  Widget build(BuildContext context) {
    final valor = maxima;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Cores.linhaFina)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              grandeza.rotulo,
              style: TextStyle(
                fontSize: 14,
                fontWeight: valor == null ? FontWeight.w600 : FontWeight.w400,
                color: valor == null ? Cores.avisoTexto : Cores.grafite,
              ),
            ),
          ),
          Text(
            valor == null ? 'Falta' : numero(valor, grandeza.unidade),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: valor == null ? Cores.avisoTexto : Cores.grafite,
            ),
          ),
        ],
      ),
    );
  }
}

class _Falhas extends StatelessWidget {
  const _Falhas({
    required this.falhas,
    required this.aoRemover,
    required this.aoNova,
  });

  final List<Falha> falhas;
  final void Function(Falha)? aoRemover;
  final VoidCallback? aoNova;

  @override
  Widget build(BuildContext context) {
    final remover = aoRemover;
    final nova = aoNova;
    return Painel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TituloSecao('Falhas', complemento: TextoSuave('${falhas.length}')),
          const SizedBox(height: 8),
          if (falhas.isEmpty) const TextoSuave('Nenhuma falha.'),
          for (final f in falhas)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 4,
                    height: 40,
                    margin: const EdgeInsets.only(right: 12, top: 2),
                    color: f.severidade == Severidade.menor
                        ? Cores.linhaForte
                        : f.severidade == Severidade.maior
                        ? Cores.amarelo
                        : Cores.vermelho,
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          f.descricao,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        TextoSuave(
                          [
                            f.severidade.rotulo,
                            if (f.componente != null) f.componente,
                            if (f.horimetro != null) numero(f.horimetro, 'h'),
                            dataHora(f.ocorridaEm),
                          ].join(', '),
                          tamanho: 13,
                        ),
                      ],
                    ),
                  ),
                  if (remover != null)
                    IconButton(
                      tooltip: 'Remover falha',
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () => remover(f),
                    ),
                ],
              ),
            ),
          if (nova != null) ...[
            const SizedBox(height: 4),
            OutlinedButton(
              onPressed: nova,
              child: const Text('Registrar falha'),
            ),
          ],
        ],
      ),
    );
  }
}
