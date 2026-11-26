/// Validações dos formulários: funções puras que devolvem a mensagem ou null.
/// São conveniência para o usuário; quem decide é a API.
library;

import 'formatos.dart';

String? validarNumero(
  String? texto, {
  bool obrigatorio = true,
  int casas = 3,
  double? minimo,
  bool positivo = false,
}) {
  final valor = (texto ?? '').trim();
  if (valor.isEmpty) return obrigatorio ? 'Informe um valor.' : null;
  final lido = lerNumero(valor);
  if (lido == null) return 'Use um número (vírgula para decimais).';
  if (casasDecimais(valor) > casas) {
    return casas == 0
        ? 'Use um número inteiro.'
        : 'Use até $casas ${casas == 1 ? 'casa decimal' : 'casas decimais'}.';
  }
  if (positivo && lido <= 0) return 'Use um valor maior que zero.';
  if (minimo != null && lido < minimo) return 'Use no mínimo ${numero(minimo)}.';
  return null;
}

String? validarTexto(String? texto, {bool obrigatorio = true, int maximo = 200}) {
  final valor = (texto ?? '').trim();
  if (valor.isEmpty) return obrigatorio ? 'Campo obrigatório.' : null;
  if (valor.length > maximo) return 'Use até $maximo caracteres.';
  return null;
}

/// Texto opcional: vazio vira null para não mandar "" à API.
String? textoOuNulo(String texto) {
  final valor = texto.trim();
  return valor.isEmpty ? null : valor;
}
