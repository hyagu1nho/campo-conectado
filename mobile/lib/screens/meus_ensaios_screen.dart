import 'package:flutter/material.dart';

import '../formatos.dart';
import '../models/ensaio.dart';
import '../models/enums.dart';
import '../services/api.dart';
import '../services/sessao.dart';
import '../tema.dart';
import '../widgets/falhas.dart';
import '../widgets/painel.dart';
import '../widgets/selo_situacao.dart';
import 'ensaio_screen.dart';

/// Filtro da lista: todos, os que ainda aceitam registros e os já enviados.
enum Filtro {
  todos('Todos'),
  aFazer('A fazer'),
  enviados('Enviados');

  const Filtro(this.rotulo);
  final String rotulo;

  bool aceita(Ensaio ensaio) => switch (this) {
    Filtro.todos => true,
    Filtro.aFazer => ensaio.situacao.aceitaRegistros,
    Filtro.enviados => !ensaio.situacao.aceitaRegistros,
  };
}

/// CU-M1: os ensaios atribuídos ao analista logado (a API filtra pelo token).
class MeusEnsaiosScreen extends StatefulWidget {
  const MeusEnsaiosScreen({super.key, required this.api, required this.sessao});

  final ApiCampo api;
  final Sessao sessao;

  @override
  State<MeusEnsaiosScreen> createState() => _MeusEnsaiosScreenState();
}

class _MeusEnsaiosScreenState extends State<MeusEnsaiosScreen> {
  List<Ensaio> _ensaios = const [];
  Filtro _filtro = Filtro.todos;
  FalhaDaApi? _falha;
  bool _carregando = false;

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
      final ensaios = await widget.api.listarEnsaios(token);
      if (!mounted) return;
      setState(() {
        _ensaios = ensaios;
        _falha = null;
      });
    } on FalhaDaApi catch (falha) {
      if (!mounted) return;
      // Uma recarga que falha não apaga a lista que já está na tela.
      setState(() => _falha = falha);
      if (falha is ErroDaApi && falha.status == 401) {
        avisarFalha(context, widget.sessao, falha);
      }
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  Future<void> _abrir(Ensaio ensaio) async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => EnsaioScreen(
          ensaioId: ensaio.id,
          api: widget.api,
          sessao: widget.sessao,
        ),
      ),
    );
    // A situação pode ter mudado (iniciado, enviado): recarrega ao voltar.
    if (mounted) await _carregar();
  }

  @override
  Widget build(BuildContext context) {
    final falha = _falha;
    final visiveis = _ensaios.where(_filtro.aceita).toList();
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: const Row(
          children: [
            Marca(),
            SizedBox(width: 12),
            Text('Meus ensaios'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: widget.sessao.sair,
            style: TextButton.styleFrom(foregroundColor: Cores.linha),
            child: const Text('Sair'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _ensaios.isEmpty && _carregando
          ? const Center(child: CircularProgressIndicator())
          : _ensaios.isEmpty && falha != null
          ? MensagemDeFalha(falha: falha, aoTentarDeNovo: _carregar)
          : RefreshIndicator(
              onRefresh: _carregar,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                children: [
                  _Filtros(
                    atual: _filtro,
                    ensaios: _ensaios,
                    aoEscolher: (f) => setState(() => _filtro = f),
                  ),
                  const SizedBox(height: 16),
                  if (visiveis.isEmpty)
                    const TextoSuave('Nenhum ensaio.')
                  else
                    for (final ensaio in visiveis) ...[
                      _CartaoEnsaio(
                        ensaio: ensaio,
                        aoTocar: () => _abrir(ensaio),
                      ),
                      const SizedBox(height: 12),
                    ],
                ],
              ),
            ),
    );
  }
}

class _Filtros extends StatelessWidget {
  const _Filtros({
    required this.atual,
    required this.ensaios,
    required this.aoEscolher,
  });

  final Filtro atual;
  final List<Ensaio> ensaios;
  final ValueChanged<Filtro> aoEscolher;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final filtro in Filtro.values)
          ChoiceChip(
            label: Text(
              '${filtro.rotulo} ${ensaios.where(filtro.aceita).length}',
            ),
            selected: filtro == atual,
            showCheckmark: false,
            onSelected: (_) => aoEscolher(filtro),
            selectedColor: Cores.grafite,
            backgroundColor: Cores.papel,
            side: BorderSide(
              color: filtro == atual ? Cores.grafite : Cores.linhaForte,
            ),
            labelStyle: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: filtro == atual ? Colors.white : Cores.grafite,
            ),
            shape: const StadiumBorder(),
          ),
      ],
    );
  }
}

class _CartaoEnsaio extends StatelessWidget {
  const _CartaoEnsaio({required this.ensaio, required this.aoTocar});

  final Ensaio ensaio;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final devolvido = ensaio.situacao == Situacao.devolvido;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: aoTocar,
        borderRadius: BorderRadius.circular(8),
        child: Painel(
          faixaEsquerda: devolvido ? Cores.vermelho : null,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SeloSituacao(situacao: ensaio.situacao),
              const SizedBox(height: 8),
              Text(
                ensaio.objetivo,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              TextoSuave(ensaio.maquina),
              TextoSuave(
                '${dataBrasileira(ensaio.dataPrevista)}, ${ensaio.area}',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
