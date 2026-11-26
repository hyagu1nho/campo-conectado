/// Valores de enum da API com o rótulo em português. `api` é o texto que
/// trafega no JSON; `deApi` falha com FormatException se vier algo novo.
library;

T _deApi<T extends Enum>(List<T> valores, String Function(T) api, Object? texto) {
  for (final valor in valores) {
    if (api(valor) == texto) return valor;
  }
  throw FormatException('Valor desconhecido: $texto');
}

enum Situacao {
  planejado('PLANEJADO', 'Planejado'),
  emAndamento('EM_ANDAMENTO', 'Em andamento'),
  enviado('ENVIADO', 'Enviado'),
  devolvido('DEVOLVIDO', 'Devolvido'),
  concluido('CONCLUIDO', 'Concluído');

  const Situacao(this.api, this.rotulo);
  final String api;
  final String rotulo;

  /// Situações em que o analista ainda registra dados (a API confere de novo).
  bool get aceitaRegistros =>
      this == planejado || this == emAndamento || this == devolvido;

  /// Situações a partir das quais o analista pode enviar.
  bool get podeEnviar => this == emAndamento || this == devolvido;

  static Situacao deApi(Object? texto) => _deApi(values, (s) => s.api, texto);
}

enum Linha {
  distribuicao('DISTRIBUICAO', 'Distribuição'),
  pulverizacao('PULVERIZACAO', 'Pulverização'),
  plantio('PLANTIO', 'Plantio');

  const Linha(this.api, this.rotulo);
  final String api;
  final String rotulo;

  static Linha deApi(Object? texto) => _deApi(values, (l) => l.api, texto);
}

/// A API guarda só o número; a unidade é a mesma usada no cliente web.
enum Grandeza {
  temperaturaMotor('TEMPERATURA_MOTOR', 'Temperatura do motor', '°C'),
  temperaturaHidraulico(
    'TEMPERATURA_HIDRAULICO',
    'Temperatura do sistema hidráulico',
    '°C',
  ),
  velocidade('VELOCIDADE', 'Velocidade', 'km/h'),
  consumoCombustivel('CONSUMO_COMBUSTIVEL', 'Consumo de combustível', 'L/h');

  const Grandeza(this.api, this.rotulo, this.unidade);
  final String api;
  final String rotulo;
  final String unidade;

  static Grandeza deApi(Object? texto) => _deApi(values, (g) => g.api, texto);
}

enum Severidade {
  critica('CRITICA', 'Crítica'),
  maior('MAIOR', 'Maior'),
  menor('MENOR', 'Menor');

  const Severidade(this.api, this.rotulo);
  final String api;
  final String rotulo;

  static Severidade deApi(Object? texto) =>
      _deApi(values, (s) => s.api, texto);
}

enum Parecer {
  conforme('CONFORME', 'Conforme'),
  conformeComRessalva('CONFORME_COM_RESSALVA', 'Conforme com ressalva'),
  naoConforme('NAO_CONFORME', 'Não conforme');

  const Parecer(this.api, this.rotulo);
  final String api;
  final String rotulo;

  /// Só "Conforme" dispensa justificativa (regra da API).
  bool get exigeJustificativa => this != conforme;

  static Parecer deApi(Object? texto) => _deApi(values, (p) => p.api, texto);
}

enum ParecerFinal {
  aprovada('APROVADA', 'Aprovada'),
  aprovadaComRessalva('APROVADA_COM_RESSALVA', 'Aprovada com ressalva'),
  reprovada('REPROVADA', 'Reprovada');

  const ParecerFinal(this.api, this.rotulo);
  final String api;
  final String rotulo;

  bool get exigeJustificativa => this != aprovada;

  static ParecerFinal deApi(Object? texto) =>
      _deApi(values, (p) => p.api, texto);
}
