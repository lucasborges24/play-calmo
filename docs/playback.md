# Background playback

## Modos
A feature é controlada por `EXPO_PUBLIC_BACKGROUND_PLAYBACK`:

| Valor  | Comportamento                                                                                  | Risco TOS |
|--------|------------------------------------------------------------------------------------------------|-----------|
| `off`  | Player pausa quando o app vai a background ou tela é bloqueada (default).                      | Nenhum    |
| `pip`  | App entra em Picture-in-Picture (Android API 26+) ao trocar de app. Tela bloqueada ainda pausa. | Baixo     |
| `full` | PiP + foreground service Android e UIBackgroundModes iOS para manter áudio com tela bloqueada. | Alto      |

## Risco YouTube TOS
Reproduzir áudio de embed YouTube com a tela bloqueada/em background sem o usuário ter YouTube Premium pode violar os Termos do YouTube. Já existem casos de revogação de acesso OAuth e remoção de apps das lojas. O modo `full` está documentado como experimental — manter `off` em produção até que exista uma regra de produto explícita (whitelist por categoria, conteúdo licenciado, etc.) que justifique o uso.

Para isolar o risco por vídeo, edite `src/features/playback/product-rule.ts` adicionando o gate por `videoId` ou categoria nas funções `isPipAllowed` e `isAudioBackgroundAllowed`.

## Rollback
Definir `EXPO_PUBLIC_BACKGROUND_PLAYBACK=off` desliga toda a feature em runtime. Nenhum serviço Android é iniciado, o flag de auto-PiP nativo não é setado e a `WebView` se comporta como antes (pausa em background).

## Arquitetura
- `src/features/playback/store.ts` — Zustand store global com modos: `closed | foreground | pip | background-audio`.
- `src/features/playback/BackgroundPlaybackHost.tsx` — singleton WebView montado em `app/(app)/_layout.tsx` que sobrevive à navegação e ao Modal.
- `src/features/playback/useBackgroundPlayback.ts` — listener `AppState`; decide PiP vs serviço vs noop conforme gate + plataforma.
- `src/features/playback/audio-session.ts` — wrapper de `expo-audio.setAudioModeAsync` com `shouldPlayInBackground` + `playsInSilentMode`.
- `src/features/playback/native-bridge.ts` — interface JS para o módulo Android `PlaybackBridge`.
- `src/features/playback/product-rule.ts` — gate central (env + por vídeo).
- `plugins/with-background-playback/` — config-plugin que injeta perms Android, `supportsPictureInPicture`, `<service PlaybackService>` e `UIBackgroundModes:[audio]` iOS.
- `android/app/src/main/java/com/synmarket/playcalmo/PlaybackBridgeModule.kt` — expõe `enterPictureInPicture`, `setAutoEnterPip`, `startPlaybackService`, `stopPlaybackService`.
- `android/app/src/main/java/com/synmarket/playcalmo/PlaybackService.kt` — foreground service `mediaPlayback` com notificação ongoing.
- `android/app/src/main/java/com/synmarket/playcalmo/MainActivity.kt` — `onUserLeaveHint` chama `enterPictureInPictureMode` quando o flag está habilitado.

## Observabilidade
Tags Sentry: `playback.capability` (off/pip/full) e `playback.mode` (foreground/pip/background-audio).
Breadcrumbs em `category: playback`: `open`, `closed`, `foreground`, `pip`, `background-audio`, `background-pause`.

## Validação local
```sh
EXPO_PUBLIC_BACKGROUND_PLAYBACK=full npx expo run:android
```
- Abre vídeo, pressiona Home → confere PiP.
- Bloqueia tela → confere notificação ongoing e áudio continuando.
- Reabre app → estado preservado.

iOS:
```sh
EXPO_PUBLIC_BACKGROUND_PLAYBACK=full npx expo run:ios
```
- Botão de PiP do iframe YouTube fica disponível.
- Bloqueio de tela mantém áudio (Control Center mostra a sessão).

Maestro: `maestro test maestro/daily-flow.yaml` (cenário cobre Home + relaunch).
