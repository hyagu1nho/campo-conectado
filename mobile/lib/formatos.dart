/// Formatação em português, sem o pacote intl (como nas aulas).
library;

String _dois(int n) => n.toString().padLeft(2, '0');

/// "2026-12-01" vira "01/12/2026", sem passar por DateTime (evita erro de fuso).
String dataBrasileira(String aaaaMmDd) {
  final partes = aaaaMmDd.split('-');
  if (partes.length != 3) return aaaaMmDd;
  return '${partes[2]}/${partes[1]}/${partes[0]}';
}

/// Data e hora no fuso do aparelho: "01/12/2026 14:30".
String dataHora(DateTime instante) {
  final t = instante.toLocal();
  return '${_dois(t.day)}/${_dois(t.month)}/${t.year} '
      '${_dois(t.hour)}:${_dois(t.minute)}';
}

/// 1520.0 vira "1520"; 36.5 vira "36,5". Null vira "-".
String numero(double? valor, [String unidade = '']) {
  if (valor == null) return '-';
  final texto = valor == valor.roundToDouble()
      ? valor.toInt().toString()
      : valor.toString().replaceAll('.', ',');
  return unidade.isEmpty ? texto : '$texto $unidade';
}

/// Lê número digitado com vírgula ou ponto; null se não for número.
double? lerNumero(String texto) {
  final normalizado = texto.trim().replaceAll(',', '.');
  if (!RegExp(r'^-?\d+(\.\d+)?$').hasMatch(normalizado)) return null;
  return double.tryParse(normalizado);
}

/// Quantas casas decimais o texto digitado tem (para respeitar a API).
int casasDecimais(String texto) {
  final normalizado = texto.trim().replaceAll(',', '.');
  final ponto = normalizado.indexOf('.');
  return ponto < 0 ? 0 : normalizado.length - ponto - 1;
}
