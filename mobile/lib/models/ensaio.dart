import 'enums.dart';

/// Lista de objetos JSON; recusa a lista inteira se um item não for objeto.
List<T> listaDeJson<T>(
  Object? json,
  T Function(Map<String, dynamic>) deJson,
) {
  if (json is! List) throw const FormatException('Esperava uma lista');
  return [
    for (final item in json)
      if (item is Map<String, dynamic>)
        deJson(item)
      else
        throw const FormatException('Item da lista não é um objeto'),
  ];
}

class Devolucao {
  const Devolucao({
    required this.comentario,
    required this.autor,
    required this.criadoEm,
  });

  final String comentario;
  final String autor;
  final DateTime criadoEm;

  factory Devolucao.fromJson(Map<String, dynamic> json) {
    final autor = json['autor'] as Map<String, dynamic>;
    return Devolucao(
      comentario: json['comentario'] as String,
      autor: autor['nome'] as String,
      criadoEm: DateTime.parse(json['criadoEm'] as String),
    );
  }
}

/// Ensaio atribuído ao analista. A listagem não traz `devolucoes`; o detalhe traz.
class Ensaio {
  const Ensaio({
    required this.id,
    required this.objetivo,
    required this.situacao,
    required this.dataPrevista,
    required this.maquina,
    required this.numeroSerie,
    required this.linha,
    required this.area,
    this.devolucoes = const [],
  });

  final int id;
  final String objetivo;
  final Situacao situacao;

  /// "AAAA-MM-DD", sem hora.
  final String dataPrevista;
  final String maquina;
  final String numeroSerie;
  final Linha linha;
  final String area;

  /// Mais recente primeiro.
  final List<Devolucao> devolucoes;

  factory Ensaio.fromJson(Map<String, dynamic> json) {
    final maquina = json['maquina'] as Map<String, dynamic>;
    final area = json['area'] as Map<String, dynamic>;
    return Ensaio(
      id: json['id'] as int,
      objetivo: json['objetivo'] as String,
      situacao: Situacao.deApi(json['situacao']),
      dataPrevista: json['dataPrevista'] as String,
      maquina: maquina['modelo'] as String,
      numeroSerie: maquina['numeroSerie'] as String,
      linha: Linha.deApi(maquina['linha']),
      area: area['nome'] as String,
      devolucoes: json['devolucoes'] == null
          ? const []
          : listaDeJson(json['devolucoes'], Devolucao.fromJson),
    );
  }
}
