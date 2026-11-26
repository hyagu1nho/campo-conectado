import 'ensaio.dart';
import 'enums.dart';

double? _decimal(Object? valor) {
  if (valor == null) return null;
  if (valor is num) return valor.toDouble();
  throw const FormatException('Esperava um número');
}

class CriterioAvaliado {
  const CriterioAvaliado({
    required this.criterio,
    required this.rotulo,
    required this.parecer,
    required this.justificativa,
  });

  /// Código da API (ex.: "ESTABILIDADE_BARRAS"), usado na rota de salvar.
  final String criterio;
  final String rotulo;
  final Parecer? parecer;
  final String? justificativa;

  factory CriterioAvaliado.fromJson(Map<String, dynamic> json) {
    return CriterioAvaliado(
      criterio: json['criterio'] as String,
      rotulo: json['rotulo'] as String,
      parecer: json['parecer'] == null ? null : Parecer.deApi(json['parecer']),
      justificativa: json['justificativa'] as String?,
    );
  }
}

/// Temperatura máxima medida contra o limite da ficha da máquina.
class Temperatura {
  const Temperatura({this.maxima, this.limite, this.excedeu});

  final double? maxima;
  final double? limite;
  final bool? excedeu;

  factory Temperatura.fromJson(Object? json) {
    if (json is! Map<String, dynamic>) {
      throw const FormatException('Temperatura em formato inesperado');
    }
    return Temperatura(
      maxima: _decimal(json['maxima']),
      limite: _decimal(json['limite']),
      excedeu: json['excedeu'] as bool?,
    );
  }
}

/// Avaliação da Pulverização como a API devolve: o que o analista preencheu,
/// as evidências calculadas e o que ainda impede o envio.
class Avaliacao {
  const Avaliacao({
    required this.velocidade,
    required this.terreno,
    required this.horimetroInicial,
    required this.horimetroFinal,
    required this.capacidadeOperacional,
    required this.capacidadeConcorrente,
    required this.parecerFinal,
    required this.justificativaFinal,
    required this.criterios,
    required this.temperaturaMotor,
    required this.temperaturaHidraulico,
    required this.falhasPorSeveridade,
    required this.horasTrabalhadas,
    required this.diferencaConcorrente,
    required this.pendencias,
  });

  final double? velocidade;
  final String? terreno;
  final double? horimetroInicial;
  final double? horimetroFinal;
  final double? capacidadeOperacional;
  final double? capacidadeConcorrente;
  final ParecerFinal? parecerFinal;
  final String? justificativaFinal;
  final List<CriterioAvaliado> criterios;
  final Temperatura temperaturaMotor;
  final Temperatura temperaturaHidraulico;
  final Map<Severidade, int> falhasPorSeveridade;
  final double? horasTrabalhadas;
  final double? diferencaConcorrente;
  final List<String> pendencias;

  int get avaliados => criterios.where((c) => c.parecer != null).length;

  factory Avaliacao.fromJson(Map<String, dynamic> json) {
    final evidencias = json['evidencias'] as Map<String, dynamic>;
    final pendencias = json['pendencias'] as List<dynamic>;
    return Avaliacao(
      velocidade: _decimal(json['velocidade']),
      terreno: json['terreno'] as String?,
      horimetroInicial: _decimal(json['horimetroInicial']),
      horimetroFinal: _decimal(json['horimetroFinal']),
      capacidadeOperacional: _decimal(json['capacidadeOperacional']),
      capacidadeConcorrente: _decimal(json['capacidadeConcorrente']),
      parecerFinal: json['parecerFinal'] == null
          ? null
          : ParecerFinal.deApi(json['parecerFinal']),
      justificativaFinal: json['justificativaFinal'] as String?,
      criterios: listaDeJson(json['criterios'], CriterioAvaliado.fromJson),
      temperaturaMotor: Temperatura.fromJson(evidencias['temperaturaMotor']),
      temperaturaHidraulico: Temperatura.fromJson(
        evidencias['temperaturaHidraulico'],
      ),
      falhasPorSeveridade: _contagem(evidencias['falhasPorSeveridade']),
      horasTrabalhadas: _decimal(evidencias['horasTrabalhadas']),
      diferencaConcorrente: _decimal(evidencias['diferencaConcorrente']),
      pendencias: [for (final p in pendencias) p.toString()],
    );
  }

  static Map<Severidade, int> _contagem(Object? json) {
    if (json is! Map<String, dynamic>) {
      throw const FormatException('Contagem de falhas em formato inesperado');
    }
    return {
      for (final s in Severidade.values) s: (json[s.api] as num?)?.toInt() ?? 0,
    };
  }
}
