import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/formatos.dart';
import 'package:mobile/validacao.dart';

void main() {
  group('validarNumero', () {
    test('aceita vírgula e respeita as casas decimais da API', () {
      expect(validarNumero('36,5', casas: 1), isNull);
      expect(validarNumero('36,55', casas: 1), 'Use até 1 casa decimal.');
      expect(validarNumero('92,125', casas: 3), isNull);
    });

    test('obrigatório, opcional, mínimo e positivo', () {
      expect(validarNumero(''), 'Informe um valor.');
      expect(validarNumero('', obrigatorio: false), isNull);
      expect(validarNumero('-1', minimo: 0), 'Use no mínimo 0.');
      expect(validarNumero('0', positivo: true), 'Use um valor maior que zero.');
      expect(validarNumero('abc'), 'Use um número (vírgula para decimais).');
    });
  });

  group('formatos', () {
    test('data da API sem passar pelo fuso', () {
      expect(dataBrasileira('2026-12-01'), '01/12/2026');
    });

    test('números em português', () {
      expect(numero(1520.0, 'h'), '1520 h');
      expect(numero(36.5), '36,5');
      expect(numero(null), '-');
      expect(lerNumero('22,4'), 22.4);
      expect(lerNumero('2,2,2'), isNull);
    });
  });
}
