import 'package:flutter/material.dart';

import '../services/api.dart';
import '../services/sessao.dart';
import '../tema.dart';
import '../widgets/painel.dart';
import '../widgets/situacao_da_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.sessao, required this.api});

  final Sessao sessao;
  final ApiCampo api;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formulario = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _senha = TextEditingController();
  bool _enviando = false;
  bool _senhaVisivel = false;
  String? _erro;

  @override
  void dispose() {
    _email.dispose();
    _senha.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    final formulario = _formulario.currentState;
    if (formulario == null || !formulario.validate()) return;

    setState(() {
      _enviando = true;
      _erro = null;
    });
    String? erro;
    try {
      await widget.sessao.entrar(
        email: _email.text.trim(),
        senha: _senha.text,
      );
    } on PerfilNaoAceito {
      erro = 'O aplicativo é do analista. Engenheiros usam o cliente web.';
    } on FalhaDaApi catch (falha) {
      if (falha is ErroDaApi && falha.status == 401) {
        erro = 'E-mail ou senha incorretos.';
      } else {
        erro = descreverFalha(falha);
      }
    }
    if (!mounted) return;
    // Com sucesso, o main troca esta tela pela lista (ouve a sessão).
    setState(() {
      _enviando = false;
      _erro = erro;
    });
  }

  @override
  Widget build(BuildContext context) {
    final erro = _erro;
    return Scaffold(
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            color: Cores.grafite,
            padding: EdgeInsets.fromLTRB(
              24,
              MediaQuery.paddingOf(context).top + 48,
              24,
              32,
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Marca(tamanho: 48),
                SizedBox(height: 16),
                Text(
                  'Campo Conectado',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formulario,
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SituacaoDaApi(api: widget.api),
                    const SizedBox(height: 8),
                    const RotuloCampo('E-mail'),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      textInputAction: TextInputAction.next,
                      validator: (valor) => (valor ?? '').contains('@')
                          ? null
                          : 'Informe um e-mail válido.',
                    ),
                    const SizedBox(height: 16),
                    const RotuloCampo('Senha'),
                    TextFormField(
                      controller: _senha,
                      obscureText: !_senhaVisivel,
                      autofillHints: const [AutofillHints.password],
                      onFieldSubmitted: (_) => _entrar(),
                      decoration: InputDecoration(
                        suffixIcon: IconButton(
                          tooltip: _senhaVisivel
                              ? 'Esconder a senha'
                              : 'Mostrar a senha',
                          icon: Icon(
                            _senhaVisivel
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: Cores.suave,
                          ),
                          onPressed: () =>
                              setState(() => _senhaVisivel = !_senhaVisivel),
                        ),
                      ),
                      validator: (valor) =>
                          (valor ?? '').isEmpty ? 'Informe a senha.' : null,
                    ),
                    if (erro != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          erro,
                          style: const TextStyle(
                            color: Cores.vermelho,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _enviando ? null : _entrar,
                      child: Text(_enviando ? 'Entrando…' : 'Entrar'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
