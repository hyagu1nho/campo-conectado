# Campo Conectado: app do analista (Flutter)

App mobile do analista de validação: ver os ensaios atribuídos, registrar medições e falhas, preencher a avaliação da Pulverização e enviar ao engenheiro.

> **Estado:** o código de `lib/` e `test/` foi escrito sem um Flutter instalado (na máquina de desenvolvimento o PowerShell, que o Flutter usa, é bloqueado por política). Nenhum comando abaixo foi executado ainda. Rode-os numa máquina com Flutter e corrija o que `flutter analyze` e `flutter test` apontarem.

## Primeira vez nesta pasta

As pastas `android/` e `ios/` não estão no repositório; o `flutter create` gera só o que falta e **não sobrescreve** `lib/`, `test/`, `pubspec.yaml` nem este README.

```bash
cd mobile
flutter create . --org br.edu.campoconectado --platforms android,ios --project-name mobile
flutter pub get
```

Depois, no `android/app/src/main/AndroidManifest.xml`, antes de `<application`:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

E no `android/app/src/debug/AndroidManifest.xml`, dentro de `<manifest>` (HTTP sem TLS só em desenvolvimento):

```xml
<application android:usesCleartextTraffic="true"/>
```

## Ícone do app

O desenho do ícone (o mesmo do cliente web) está em `assets/icone.svg`. O Android e o iOS pedem o ícone em PNG em vários tamanhos: exporte o SVG para um PNG de 1024x1024 (`assets/icone.png`) e gere os tamanhos com o pacote `flutter_launcher_icons`:

```bash
flutter pub add dev:flutter_launcher_icons
```

No `pubspec.yaml`:

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icone.png"
```

```bash
dart run flutter_launcher_icons
```

## Fonte

O app usa a Montserrat, a mesma do cliente web (`lib/tema.dart`). Os arquivos estão em `assets/fontes/` (Regular, Medium, SemiBold e Bold), baixados do projeto oficial (github.com/JulietaUla/Montserrat), e registrados no `pubspec.yaml`. A licença é a SIL Open Font License, em `assets/fontes/OFL.txt`, que precisa acompanhar os arquivos.

## Conferir

```bash
flutter analyze      # esperado: No issues found!
flutter test         # esperado: All tests passed!
```

Os testes usam um `MockClient`: não precisam da API no ar.

## Rodar

Com a API no ar (`npm run start:dev` em `backend/`):

| Onde o app roda | Comando |
|---|---|
| Emulador Android | `flutter run --dart-define=API_URL=http://10.0.2.2:3000` |
| Celular na mesma rede | `flutter run --dart-define=API_URL=http://<ip-do-computador>:3000` |

Trocar o `API_URL` exige rodar de novo (hot reload não basta). A tela de login mostra se a API respondeu (`GET /saude`).

Usuário de teste: `analista@campo.dev` (senha no `backend/prisma/seed.ts`). O engenheiro é recusado no app: ele usa o cliente web.

## Organização

```
lib/
├── main.dart                 # cria ApiCampo e Sessao; login ou meus ensaios
├── formatos.dart             # datas e números em português
├── validacao.dart            # validações dos formulários
├── tema.dart                 # cores, fonte e estilo dos botões e campos (padrão visual)
├── models/                   # enums, ensaio, medição, falha, avaliação (fromJson manual)
├── services/
│   ├── config.dart           # API_URL via --dart-define
│   ├── api.dart              # ApiCampo + FalhaDaApi (SemConexao, TempoEsgotado, ErroDaApi, RespostaInesperada)
│   └── sessao.dart           # sessão Simplificada: token só em memória
├── screens/                  # login, meus ensaios, ensaio, nova medição, nova falha, avaliação
└── widgets/                  # painel, escolha em grade, rodapé de ação, selo, situação da API, falhas
```

## Sessão (nível Simplificada)

Login real contra a API; o token fica só em memória e se perde ao fechar o app. Quando a API responde 401 (o token dura 1 hora), o app volta ao login. Nenhuma rota da API foi afrouxada para o app.
