import 'enums.dart';

/// Número do JSON (int ou double) como double; null continua null.
double? _decimal(Object? valor) {
  if (valor == null) return null;
  if (valor is num) return valor.toDouble();
  throw const FormatException('Esperava um número');
}

class Medicao {
  const Medicao({
    required this.id,
    required this.grandeza,
    required this.valor,
    required this.horimetro,
    required this.observacao,
    required this.registradaEm,
  });

  final int id;
  final Grandeza grandeza;
  final double valor;
  final double? horimetro;
  final String? observacao;
  final DateTime registradaEm;

  factory Medicao.fromJson(Map<String, dynamic> json) {
    return Medicao(
      id: json['id'] as int,
      grandeza: Grandeza.deApi(json['grandeza']),
      valor: (json['valor'] as num).toDouble(),
      horimetro: _decimal(json['horimetro']),
      observacao: json['observacao'] as String?,
      registradaEm: DateTime.parse(json['registradaEm'] as String),
    );
  }
}

class Falha {
  const Falha({
    required this.id,
    required this.descricao,
    required this.componente,
    required this.severidade,
    required this.horimetro,
    required this.ocorridaEm,
  });

  final int id;
  final String descricao;
  final String? componente;
  final Severidade severidade;
  final double? horimetro;
  final DateTime ocorridaEm;

  factory Falha.fromJson(Map<String, dynamic> json) {
    return Falha(
      id: json['id'] as int,
      descricao: json['descricao'] as String,
      componente: json['componente'] as String?,
      severidade: Severidade.deApi(json['severidade']),
      horimetro: _decimal(json['horimetro']),
      ocorridaEm: DateTime.parse(json['ocorridaEm'] as String),
    );
  }
}
