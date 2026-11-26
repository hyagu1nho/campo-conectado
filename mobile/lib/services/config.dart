/// Endereço da API, definido na compilação com
/// `--dart-define=API_URL=...`. O padrão é o computador visto de dentro do
/// emulador Android (10.0.2.2). Trocar exige rodar de novo, não hot reload.
const enderecoDaApi = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000',
);
