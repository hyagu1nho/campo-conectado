import 'package:flutter/material.dart';

import '../formatos.dart';
import '../models/enums.dart';
import '../services/api.dart';
import '../services/sessao.dart';
import '../validacao.dart';
import '../tema.dart';
import '../widgets/falhas.dart';
import '../widgets/painel.dart';

/// Registra uma medição. Devolve `true` ao gravar, para o ensaio recarregar.
class NovaMedicaoScreen extends StatefulWidget {
  const NovaMedicaoScreen({
    super.key,
    required this.ensaioId,
    required this.api,
    required this.sessao,
  });

  final int ensaioId;
  final ApiCampo api;
  final Sessao sessao;

  @override
  State<NovaMedicaoScreen> createState() => _NovaMedicaoScreenState();
}

class _NovaMedicaoScreenState extends State<NovaMedicaoScreen> {
  final _formulario = GlobalKey<FormState>();
  final _valor = TextEditingController();
  final _horimetro = TextEditingController();
  final _observacao = TextEditingController();
  Grandeza? _grandeza;
  bool _enviando = false;
  String? _erro;
  String? _erroGrandeza;

  @override
  void dispose() {
    _valor.dispose();
    _horimetro.dispose();
    _observacao.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    final formulario = _formulario.currentState;
    final grandeza = _grandeza;
    final token = widget.sessao.token;
    final valido = formulario != null && formulario.validate();
    setState(
      () => _erroGrandeza = grandeza == null ? 'Escolha a grandeza.' : null,
    );
    if (!valido || grandeza == null || token == null) return;
    final valor = lerNumero(_valor.text);
    if (valor == null) return;

    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      await widget.api.registrarMedicao(
        token,
        widget.ensaioId,
        grandeza: grandeza,
        valor: valor,
        horimetro: lerNumero(_horimetro.text),
        observacao: textoOuNulo(_observacao.text),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } on FalhaDaApi catch (falha) {
      if (!mounted) return;
      if (falha is ErroDaApi && falha.status == 401) {
        avisarFalha(context, widget.sessao, falha);
        return;
      }
      // Recusa da API (400 ou 409): mostra o motivo e mantém o que foi digitado.
      setState(() {
        _enviando = false;
        _erro = descreverFalha(falha);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final erro = _erro;
    final erroGrandeza = _erroGrandeza;
    final grandeza = _grandeza;
    return Scaffold(
      appBar: AppBar(title: const Text('Nova medição')),
      body: Form(
        key: _formulario,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const RotuloCampo('Grandeza'),
            EscolhaEmGrade<Grandeza>(
              opcoes: Grandeza.values,
              rotulo: (g) => g.rotulo,
              valor: grandeza,
              aoEscolher: (g) => setState(() {
                _grandeza = g;
                _erroGrandeza = null;
              }),
            ),
            if (erroGrandeza != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  erroGrandeza,
                  style: const TextStyle(color: Cores.vermelho, fontSize: 13),
                ),
              ),
            const SizedBox(height: 16),
            const RotuloCampo('Valor'),
            TextFormField(
              controller: _valor,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              decoration: InputDecoration(suffixText: grandeza?.unidade),
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
                signed: true,
              ),
              textInputAction: TextInputAction.next,
              validator: (texto) => validarNumero(texto, casas: 3),
            ),
            const SizedBox(height: 16),
            const RotuloCampo('Horímetro', opcional: true),
            TextFormField(
              controller: _horimetro,
              decoration: const InputDecoration(suffixText: 'h'),
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              textInputAction: TextInputAction.next,
              validator: (texto) => validarNumero(
                texto,
                obrigatorio: false,
                casas: 1,
                minimo: 0,
              ),
            ),
            const SizedBox(height: 16),
            const RotuloCampo('Observação', opcional: true),
            TextFormField(
              controller: _observacao,
              maxLines: 3,
              validator: (texto) =>
                  validarTexto(texto, obrigatorio: false, maximo: 500),
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
          child: Text(_enviando ? 'Salvando…' : 'Salvar medição'),
        ),
      ),
    );
  }
}
