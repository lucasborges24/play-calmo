# Play Calmo — Implementation Prompt

Pacote de handoff para o desenvolvedor/CLI. Cole o prompt abaixo no CLI (Claude Code, Cursor, etc.) junto com a pasta `brand/`.

---

## 📦 Conteúdo da pasta `brand/`

**SVGs (vetor — escalam infinitamente):**
- `logo-primary.svg` — marca principal, vermelho sobre branco
- `logo-inverted.svg` — branco com play vermelho (para fundos coloridos)
- `logo-mono-dark.svg` — versão preta (modo escuro)
- `logo-outline.svg` — contornada (tamanhos pequenos ≤16px)
- `logo-mark-only.svg` — só triângulo + onda, sem container
- `wordmark-horizontal.svg` — só tipografia, claro
- `wordmark-horizontal-dark.svg` — só tipografia, escuro
- `lockup-horizontal.svg` — marca + wordmark lado a lado

**PNGs (raster, exatos para cada uso):**
- `icon-1024.png` — App Store / Google Play (marketing)
- `icon-512.png` — Android Play Store listing
- `icon-192.png` — Android (xxxhdpi), PWA
- `icon-180.png` — iOS home screen (@3x)
- `icon-120.png` — iOS (@2x, spotlight)
- `icon-96.png`  — Android (xxhdpi)
- `icon-48.png`  — Android notification
- `favicon-32.png` — browser tab
- `favicon-16.png` — browser tab (outline)

---

## 🔧 Prompt para o CLI

```
Preciso integrar a identidade visual do Play Calmo no projeto Expo
(React Native + NativeWind v4). Os assets estão na pasta `brand/`.

FAÇA:

1. Crie um componente reutilizável `src/components/Logo.tsx` com a API:
   <Logo variant="primary" | "inverted" | "mono" | "outline" | "mark" size={N} />
   Use react-native-svg. Baseie a geometria em:
     viewBox: 0 0 96 96
     container: rect rx=22 (ocultar quando variant="mark")
     triangle:  M36 26 L36 54 L62 40 Z
     wave:      M14 68 Q 24 60, 34 68 T 54 68 T 74 68 T 82 68
                stroke-width 3.2, linecap round
     Cores por variant:
       primary  → bg #E53535, fg #FFFFFF
       inverted → bg #FFFFFF, fg #E53535
       mono     → bg #111111, fg #FFFFFF
       outline  → bg #FFFFFF + border #111111 1.5px, fg #111111
       mark     → sem bg, fg #E53535 (aceitar override via prop `color`)

2. Crie `src/components/Wordmark.tsx`:
   <Wordmark size={N} color="#111" accent="#E53535" />
   Render: "play" + "." (cor accent) + "calmo"
   Fonte: DM Sans, weight 800, letter-spacing -5%
   Nunca usar o wordmark sem `DM Sans` carregado — faça fallback para a
   variante "mark" se a fonte não estiver pronta.

3. Configure os app icons:
   - iOS: copie `icon-1024.png` para `assets/icon.ios.png`
   - Android adaptive: use `icon-192.png` como foreground, cor de fundo
     #E53535 em `app.json`:
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/icon-192.png",
           "backgroundColor": "#E53535"
         }
       }
   - Favicon web (Expo Router): `assets/favicon-32.png`
   - Splash screen: use `icon-512.png` com resizeMode "contain" e
     backgroundColor "#F7F7F5" (claro) / "#0D0D0D" (escuro).

4. Atualize a SplashScreen para mostrar:
   - Logo primary centralizado (96px)
   - Wordmark abaixo (26px)
   - Tagline no rodapé: "Seu YouTube, devagar" (uppercase, 10px,
     letter-spacing 1.5px, cor #999)

5. Substitua todos os lugares no app onde aparece o texto "Play Calmo"
   literal por `<Wordmark />` quando o contexto visual permitir (login,
   splash, config → conta). Manter como texto só em avisos do SO
   (ex: notificação).

6. Regras de uso a respeitar (lint opcional):
   - Nunca rotacionar
   - Nunca distorcer (scale não-uniforme)
   - Nunca aplicar gradientes
   - Clear space mínimo = metade do rx do container (11px em 96px)
   - Triângulo + onda são uma unidade; não separar

CHECKLIST de verificação depois de implementar:
☐ Logo renderiza nítido em todas as variantes
☐ Tela de splash usa os assets corretos para iOS e Android
☐ Adaptive icon do Android mostra só a marca branca sobre vermelho
☐ Favicon aparece na versão web
☐ DM Sans carrega antes do primeiro render do Wordmark
☐ Dark mode troca `primary` → `inverted` no header do app
```

---

## 🎨 Tokens rápidos (copie para `tailwind.config.js`)

```js
colors: {
  brand: {
    red:      '#E53535',  // primary
    redPress: '#C42B2B',  // pressed state
    ink:      '#111111',  // text on light
    off:      '#F7F7F5',  // off-white bg
  }
}
```

## 📐 Clear space

Mínimo em volta da marca = **metade do border-radius** do container (11px para uma marca de 96px). Em contextos apertados, suba para 1× o border-radius (22px) para dar respiro.

## 🔤 Wordmark — regras tipográficas

- **Fonte:** DM Sans, weight 800
- **Letter-spacing:** −5% (−2.8px em 56px)
- **O ponto vermelho** substitui o "play" do botão de vídeo — sempre entre "play" e "calmo"
- **Nunca mudar a fonte.** DM Sans é parte da identidade.

## ❌ Don't

1. Não rotacionar a marca
2. Não aplicar gradientes (só cores sólidas da paleta)
3. Não comprimir em um eixo (scale-x / scale-y)
4. Não separar triângulo e onda
5. Não colocar em fundos de baixo contraste sem usar a variante outline
