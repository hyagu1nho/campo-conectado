import 'package:flutter/material.dart';

/// Cores do padrão visual, as mesmas do cliente web. Aço é o fundo, papel os
/// painéis e grafite a barra de cima. Amarelo só para atenção.
abstract final class Cores {
  static const aco = Color(0xFFE8ECEE);
  static const papel = Color(0xFFFFFFFF);
  static const grafite = Color(0xFF1F2629);
  static const verde = Color(0xFF2D6A30);
  static const amarelo = Color(0xFFE8A317);
  static const vermelho = Color(0xFFB3261E);
  static const suave = Color(0xFF56636A);
  static const linha = Color(0xFFC9D0D3);
  static const linhaFina = Color(0xFFE3E7E9);
  static const linhaForte = Color(0xFFAEB8BC);
  static const marcaAtiva = Color(0xFF7CCF80);

  static const sucessoFundo = Color(0xFFDDEEDB);
  static const sucessoTexto = Color(0xFF1F5223);
  static const avisoFundo = Color(0xFFFDF0D2);
  static const avisoTexto = Color(0xFF7A5200);
  static const perigoFundo = Color(0xFFF9E3E1);
  static const perigoTexto = Color(0xFF8E1F18);
  static const infoFundo = Color(0xFFDCE8F5);
  static const infoTexto = Color(0xFF1D4F86);
  static const neutroFundo = Color(0xFFE1E6E8);
  static const neutroTexto = Color(0xFF3B474C);
}

/// Família tipográfica, registrada no pubspec.yaml (assets/fontes).
const fonte = 'Montserrat';

const _raioControle = BorderRadius.all(Radius.circular(4));
const _raioPainel = BorderRadius.all(Radius.circular(8));

ThemeData temaCampo() {
  final esquema = ColorScheme.fromSeed(
    seedColor: Cores.verde,
    primary: Cores.verde,
    onPrimary: Colors.white,
    error: Cores.vermelho,
    surface: Cores.papel,
    onSurface: Cores.grafite,
    outline: Cores.linhaForte,
    outlineVariant: Cores.linha,
  );
  const botao = Size.fromHeight(48);
  const textoBotao = TextStyle(
    fontFamily: fonte,
    fontWeight: FontWeight.w600,
    fontSize: 15,
  );

  return ThemeData(
    colorScheme: esquema,
    fontFamily: fonte,
    scaffoldBackgroundColor: Cores.aco,
    appBarTheme: const AppBarTheme(
      backgroundColor: Cores.grafite,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: fonte,
        fontWeight: FontWeight.w700,
        fontSize: 17,
        color: Colors.white,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: botao,
        shape: const RoundedRectangleBorder(borderRadius: _raioControle),
        textStyle: textoBotao,
        disabledBackgroundColor: Cores.linha,
        disabledForegroundColor: Cores.suave,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: botao,
        foregroundColor: Cores.grafite,
        backgroundColor: Cores.papel,
        side: const BorderSide(color: Cores.linhaForte),
        shape: const RoundedRectangleBorder(borderRadius: _raioControle),
        textStyle: textoBotao,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: Cores.verde,
        textStyle: textoBotao,
      ),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: Cores.papel,
      isDense: false,
      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: _raioControle,
        borderSide: BorderSide(color: Cores.linhaForte),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: _raioControle,
        borderSide: BorderSide(color: Cores.linhaForte),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: _raioControle,
        borderSide: BorderSide(color: Cores.verde, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: _raioControle,
        borderSide: BorderSide(color: Cores.vermelho, width: 2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: _raioControle,
        borderSide: BorderSide(color: Cores.vermelho, width: 2),
      ),
      suffixStyle: TextStyle(color: Cores.suave),
    ),
    cardTheme: const CardThemeData(
      color: Cores.papel,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: _raioPainel,
        side: BorderSide(color: Cores.linha),
      ),
    ),
    dividerTheme: const DividerThemeData(color: Cores.linhaFina, space: 1),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: Cores.grafite,
    ),
  );
}
