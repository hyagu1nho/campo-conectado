import 'package:flutter/material.dart';

import '../formatos.dart';
import '../models/enums.dart';
import '../services/api.dart';
import '../services/sessao.dart';
import '../validacao.dart';
import '../tema.dart';
import '../widgets/falhas.dart';
import '../widgets/painel.dart';

/// Registra uma falha com a severidade. Devolve `true` ao gravar.
class NovaFalhaScreen extends StatefulWidget {
  const NovaFalhaScreen({
    super.key,
    required this.ensaioId,
    required this.api,
    required this.sessao,
  });

  final int ensaioId;
  final ApiCampo api;
  final Sessao sessao;

  @override
  State<NovaFalhaScreen> createState() => _NovaFalhaScreenState();
}

class _NovaFalhaScreenState extends State<NovaFalhaScreen> {
  final _formulario = GlobalKey<FormState>();
  final _descricao = TextEditingController();
  final _componente = TextEditingController();
  final _horimetro = TextEditingController();
  Severidade? _severidade;
  bool _enviando = false;
  String? _erro;
  String? _erroSeveridade;

  @override
  void dispose() {
    _descricao.dispose();
    _componente.dispose();
    _horimetro.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    final formulario = _formulario.currentState;
    final severidade = _severidade;
    final token = widget.sessao.token;
    final valido = formulario != null && formulario.validate();
    setState(
      () => _erroSeveridade =
          severidade == null ? 'Escolha a severidade.' : null,
    );
    if (!valido || severidade == null || token == null) return;

    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      await widget.api.registrarFalha(
        token,
        widget.ensaioId,
        descricao: _descricao.text.trim(),
        severidade: severidade,
        componente: textoOuNulo(_componente.text),
        horimetro: lerNumero(_horimetro.text),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } on FalhaDaApi catch (falha) {
      if (!mounted) return;
      if (falha is ErroDaApi && falha.status == 401) {
        avisarFalha(context, widget.sessao, falha);
        return;
      }
      setState(() {
        _enviando = false;
        _erro = descreverFalha(falha);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final erro = _erro;
    final erroSeveridade = _erroSeveridade;
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar falha')),
      body: Form(
        key: _formulario,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const RotuloCampo('Descrição'),
            TextFormField(
              controller: _descricao,
              maxLines: 3,
              textInputAction: TextInputAction.next,
              validator: (texto) => validarTexto(texto, maximo: 1000),
            ),
            const SizedBox(height: 16),
            const RotuloCampo('Componente', opcional: true),
            TextFormField(
              controller: _componente,
              textInputAction: TextInputAction.next,
              validator: (texto) =>
                  validarTexto(texto, obrigatorio: false, maximo: 120),
            ),
            const SizedBox(height: 16),
            const RotuloCampo('Severidade'),
            EscolhaEmGrade<Severidade>(
              opcoes: const [
                Severidade.menor,
                Severidade.maior,
                Severidade.critica,
              ],
              colunas: 3,
              rotulo: (s) => s.rotulo,
              valor: _severidade,
              cor: (s) => switch (s) {
                Severidade.menor => Cores.grafite,
                Severidade.maior => Cores.amarelo,
                Severidade.critica => Cores.vermelho,
              },
              aoEscolher: (s) => setState(() {
                _severidade = s;
                _erroSeveridade = null;
              }),
            ),
            if (erroSeveridade != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  erroSeveridade,
                  style: const TextStyle(color: Cores.vermelho, fontSize: 13),
                ),
              ),
            const SizedBox(height: 16),
            const RotuloCampo('Horímetro', opcional: true),
            TextFormField(
              controller: _horimetro,
              decoration: const InputDecoration(suffixText: 'h'),
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              validator: (texto) => validarNumero(
                texto,
                obrigatorio: false,
                casas: 1,
                minimo: 0,
              ),
            ),
            if (erro != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(erro, style: const TextStyle(color: Cores.vermelho)),
              ),
          ],
        ),
      ),
      bottomNavigationBar: RodapeDeAcao(
        child: FilledButton(
          onPressed: _enviando ? null : _salvar,
          child: Text(_enviando ? 'Salvando…' : 'Salvar falha'),
        ),
      ),
    );
  }
}
