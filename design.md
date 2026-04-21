# Play Calmo Design

Este documento descreve o design de produto, a arquitetura e as principais decisões de UX e engenharia do projeto a partir do código atual do repositório. Ele deve ser tratado como um documento vivo: quando o comportamento do app mudar, este arquivo deve mudar junto.

## 1. Resumo

O Play Calmo é um app mobile de curadoria pessoal para YouTube.

Em vez de reproduzir o modelo de feed infinito, o produto transforma inscrições e vídeos recentes em uma rotina diária limitada por tempo. A proposta central é simples:

- sincronizar as inscrições do usuário;
- buscar vídeos novos dos canais relevantes;
- montar uma timeline diária compatível com a meta de tempo configurada;
- permitir triagem local clara entre assistir, excluir, remover do dia e restaurar depois.

O app é local-first. O estado principal do produto vive em SQLite no dispositivo. A rede é usada para autenticação Google, leitura de dados do YouTube e telemetria/erros quando configurados.

## 2. Objetivo do Produto

### Objetivo principal

Ajudar o usuário a manter uma rotina de consumo de vídeo mais intencional, limitada e recuperável.

### O que o app faz hoje

- autentica com Google;
- sincroniza inscrições do YouTube;
- coleta vídeos recentes por canal;
- opcionalmente mistura vídeos de trending de canais já conhecidos;
- gera um plano diário com alvo de duração;
- permite marcar vídeos como vistos, excluídos ou removidos do dia;
- preserva histórico local em uma biblioteca pesquisável;
- agenda lembrete diário e executa atualização em background/foreground quando o app fica “velho”.

### O que o app explicitamente evita

- feed infinito como experiência primária;
- dependência de backend próprio para operar;
- estados complexos demais para a triagem do usuário;
- perda silenciosa de conteúdo: quase tudo pode ser recuperado pela biblioteca.

## 3. Princípios de Design

### 3.1 Calma antes de volume

O app organiza o consumo por capacidade diária, não por quantidade máxima de vídeos disponíveis.

### 3.2 Local-first

SQLite é a fonte de verdade do produto no dispositivo. A UI reage a queries locais em tempo real com `useLiveQuery`.

### 3.3 Estados explícitos e reversíveis

O sistema evita um enum de status único para vídeos e usa timestamps separados (`watchedAt`, `excludedAt`, `removedAt`) para modelar ações reais do usuário e facilitar reversão.

### 3.4 Continuidade visual

Ao atualizar listas, o app tenta preservar o conteúdo anterior enquanto a nova consulta resolve, evitando telas vazias e flicker. Isso aparece no uso de `useRetainedLiveQueryData` e overlays leves de carregamento.

### 3.5 Curadoria acima de automação

O app sugere, monta e reabastece o plano diário, mas deixa claro quando o usuário excluiu, removeu ou já assistiu algo.

## 4. Experiência do Usuário

### 4.1 Fluxo principal

1. Usuário faz login com Google.
2. O app executa migrações e seed local.
3. Na primeira entrada autenticada, sincroniza inscrições.
4. A tela `Hoje` cria ou reusa o plano diário.
5. O usuário assiste, marca como visto, remove do dia ou exclui.
6. Se o plano ficar muito curto, o sistema tenta reabastecer automaticamente.
7. Tudo que já passou pela curadoria permanece rastreável na biblioteca.

### 4.2 Navegação principal

O app usa `expo-router` com quatro tabs:

- `Hoje`: timeline diária e ponto principal de consumo.
- `Inscrições`: catálogo de canais sincronizados e ativação/desativação local.
- `Biblioteca`: histórico local dividido em não assistidos, assistidos e excluídos.
- `Configurações`: conta, aparência, metas, sincronização, job, notificações e manutenção.

Também existe:

- `sign-in`: entrada pública;
- `modal`: reservado para fluxos auxiliares.

### 4.3 Telas

#### Hoje

É o centro do produto. Exibe:

- progresso da meta diária;
- lista de vídeos planejados;
- ações rápidas por vídeo;
- disparo manual do job de atualização;
- feedback de loading sem limpar a lista anterior.

#### Inscrições

É a camada de controle de origem. Exibe:

- total de canais;
- quantos estão ativos;
- última sincronização;
- alternância local de canal ativo/inativo.

#### Biblioteca

É a camada de memória e recuperação. Exibe:

- segmentação por `Não assistidos`, `Assistidos` e `Excluídos`;
- busca por título ou canal;
- restauração de excluídos;
- desfazer de vistos;
- ações contextuais por card.

#### Configurações

Concentra preferências operacionais do produto:

- conta;
- tema;
- meta diária;
- limites de sincronização/job;
- trending;
- lembrete diário;
- limpeza de histórico antigo;
- remoção local de dados.

## 5. Direção Visual

### 5.1 Personalidade visual

O visual atual é quente, editorial e levemente tátil, evitando aparência genérica de dashboard técnico.

### 5.2 Sistema base

- tipografia: `DM Sans`;
- cor primária: vermelho `#E53535`;
- neutros claros: fundos off-white e superfícies quentes;
- neutros escuros: preto/grafite com contraste moderado;
- superfícies em cards arredondados;
- blobs suaves de fundo para dar atmosfera sem competir com o conteúdo.

### 5.3 Padrões de interface

- `Panel` como bloco principal de agrupamento;
- `FloatingTabBar` como navegação persistente;
- `SegmentedControl` para estados mutuamente exclusivos;
- skeletons em vez de loaders agressivos;
- feedback contextual leve para refresh e background work.

### 5.4 Intenção de UX

O app não tenta parecer um player ou uma rede social. Ele deve parecer uma ferramenta pessoal de organização de tempo e atenção.

## 6. Arquitetura Técnica

### 6.1 Stack

- Expo / React Native
- Expo Router
- TypeScript
- Drizzle ORM + Expo SQLite
- TanStack Query
- NativeWind
- Expo Notifications
- Expo Background Fetch / Task Manager
- Secure Store para tokens sensíveis
- Sentry para observabilidade

### 6.2 Estrutura do código

O projeto está dividido em três eixos:

- `app/`: rotas e composição de telas;
- `src/features/`: regras de negócio por domínio;
- `src/shared/`: UI compartilhada, tema, utilitários e infraestrutura de apoio;
- `src/db/`: schema, migrações, seed e queries locais.

### 6.3 Boot da aplicação

Na inicialização:

1. fontes são carregadas;
2. preferência de tema é carregada;
3. migrações SQLite são executadas;
4. seed inicial garante estado mínimo;
5. providers de tema, query e navegação são montados;
6. o app decide entre redirecionar para login ou abrir a área autenticada.

## 7. Modelo de Dados

### `session`

Sessão autenticada atual no dispositivo.

- identidade básica Google;
- access token;
- expiração do token;
- metadata de criação.

### `subscriptions`

Canais conhecidos do usuário.

- espelha a inscrição no YouTube;
- guarda `uploadsPlaylistId` para ingestão;
- permite `isActive` local sem depender do estado remoto;
- marca unsubscription com timestamp, sem apagar o registro.

### `videos`

Catálogo local de vídeos elegíveis, assistidos ou excluídos.

- origem: `subscription` ou `trending`;
- timestamps independentes para `watchedAt` e `excludedAt`;
- não depende de status textual derivado.

### `dailyPlans`

Cabeçalho do plano diário.

- um por data;
- guarda meta em minutos;
- registra momento de geração.

### `dailyPlanVideos`

Itens do plano diário.

- ordenação por `position`;
- remoção lógica com `removedAt`;
- mantém histórico do que já entrou em um plano.

### `settings`

Preferências operacionais do app.

- meta diária;
- limites do job;
- inclusão de trending;
- região;
- horários e estado de notificação;
- timestamps de última sync e último job;
- filtro mínimo de duração.

### `jobRuns`

Rastro operacional local dos jobs.

- gatilho (`manual`, `background`, `foreground-catch-up`);
- início/fim;
- quantidade processada;
- erro resumido, quando houver.

## 8. Fluxos de Dados

### 8.1 Autenticação

- login Google nativo no Android e OAuth code flow nas demais plataformas suportadas;
- perfil e access token vão para SQLite;
- refresh token vai para Secure Store;
- logout revoga tokens e limpa sessão local.

### 8.2 Sincronização de inscrições

`syncSubscriptions()`:

- lê inscrições remotas do YouTube;
- resolve playlists de upload quando necessário;
- insere novas inscrições;
- atualiza metadados alterados;
- marca inscrições sumidas como inativas/unsubscribed;
- atualiza `lastSubsSyncAt`.

### 8.3 Job de coleta de vídeos

`runFetchVideosJob()`:

- abre um registro em `jobRuns`;
- busca canais elegíveis segundo limites do usuário;
- coleta candidatos por playlist de uploads;
- faz fallback para busca por canal quando a playlist falha;
- filtra duplicados e vídeos curtos;
- grava vídeos novos;
- opcionalmente injeta trending apenas de canais já conhecidos;
- fecha o job com resumo local.

### 8.4 Planejamento diário

`generateDailyPlan()` e `refillPlan()`:

- partem da meta do usuário;
- trabalham com margem de 5%;
- escolhem vídeos por heurística gulosa com embaralhamento;
- evitam vídeos vistos ou excluídos;
- reabastecem o plano quando ele cai abaixo do limite inferior.

### 8.5 Biblioteca

A biblioteca é uma projeção do catálogo local:

- `unwatched`: sem `watchedAt` e sem `excludedAt`;
- `watched`: com `watchedAt`;
- `excluded`: com `excludedAt`.

Isso mantém o modelo simples e barato de consultar.

### 8.6 Atualização automática

O app tenta manter o conteúdo fresco de três formas:

- manualmente pela UI;
- em background, quando o último job está velho;
- em foreground, ao voltar ao app após um período de staleness.

## 9. Decisões Importantes de Design

### 9.1 Sem backend próprio

O produto atual foi desenhado para funcionar sem um servidor central. Isso reduz complexidade operacional e favorece privacidade/localidade, com o custo de limitar sincronização multi-device e observabilidade de estado do usuário.

### 9.2 Estado por timestamps, não por enum

`watchedAt`, `excludedAt` e `removedAt` capturam ações independentes. Isso simplifica regras como desfazer, restaurar e reconstruir listas derivadas.

### 9.3 Inscrição remota vs. ativação local

O usuário pode manter o canal inscrito no YouTube, mas desativado dentro do Play Calmo. Esse desacoplamento é deliberado.

### 9.4 Trending com escopo controlado

Trending não é uma segunda timeline aberta. Ele só reforça canais que o usuário já conhece, o que preserva a proposta de curadoria calma.

### 9.5 Refresh sem apagar contexto

As listas priorizam retenção do conteúdo anterior enquanto atualizam. O objetivo é evitar uma sensação de instabilidade visual.

## 10. Restrições e Trade-offs

- background fetch em mobile é best-effort e depende do sistema operacional;
- OAuth tem limitações no Expo Go;
- sem backend, não existe sincronização de biblioteca entre dispositivos;
- heurística gulosa do plano diário é pragmática, não ótima;
- dependência do YouTube significa lidar com falhas parciais de API e metadados incompletos.

## 11. O Que Deve Permanecer Verdadeiro

Qualquer evolução do produto deve preservar estes invariantes:

- o app continua sendo uma ferramenta de curadoria, não um feed infinito;
- a fonte de verdade local continua simples de inspecionar e migrar;
- estados do usuário continuam reversíveis;
- atualização de dados não destrói o contexto visual da tela;
- configurações continuam controlando capacidade diária, não apenas volume bruto de ingestão.

## 12. Próximos Passos Naturais

Se o projeto evoluir, os próximos incrementos mais coerentes com este design são:

- melhorar a heurística de montagem do plano diário;
- adicionar explicabilidade de por que um vídeo entrou no plano;
- criar métricas locais de aderência à meta diária;
- permitir presets de curadoria por contexto;
- preparar uma estratégia opcional de sync multi-device sem sacrificar o modelo local-first.
