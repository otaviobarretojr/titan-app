# TITAN v0.9.0-rc.2 — Auditoria técnica

**Data da auditoria:** 3 de agosto de 2026  
**Escopo:** `README.md`, toda a documentação em `docs/`, toda a árvore `src/`, `package.json`, configurações TypeScript/ESLint/Vite, PWA e artefatos de produção.  
**Princípio desta etapa:** somente documentação foi alterada; nenhum código-fonte ou configuração foi corrigido.

## 1. Resumo executivo

O TITAN já é uma aplicação local-first funcional, com boa separação por domínio, navegação mobile, persistência reativa e uma cobertura funcional ampla. O Release Candidate compila, passa no ESLint e no TypeScript e gera os artefatos PWA esperados. As rotas já são carregadas com `React.lazy`, e o build produz chunks por página.

A base ainda não deve ser classificada como v1.0 estável. Os principais bloqueadores são a ausência de testes automatizados e de uma estratégia verificável de migração/recuperação do banco, a restauração de backup com validação apenas estrutural, possíveis duplicidades causadas por operações “consultar e depois inserir” sem unicidade no schema, fotos sem limite ou compressão no IndexedDB e notificações que configuram preferências, mas não executam lembretes. Também há inconsistências visíveis, como dois grids com as mesmas métricas no Dashboard.

**Parecer:** RC2 tecnicamente publicável para homologação, mas **não recomendado para promoção direta a v1.0** antes dos itens P0 e P1 da seção 16.

## 2. Evidências e resultado dos comandos

| Etapa | Resultado | Observações |
| --- | --- | --- |
| `npm ci` | Aprovado | 509 pacotes instalados; aviso de configuração `http-proxy` desconhecida e depreciação de uma dependência transitiva `glob@11.1.0`. |
| `npm run validate` | Aprovado | ESLint, `tsc --noEmit`, build e validação dos arquivos de release passaram. |
| `npm run build` | Aprovado | 1.956 módulos transformados; PWA `generateSW`; 45 entradas/587,06 KiB no precache. |

Tamanhos relevantes do build (não comprimidos / gzip):

- núcleo `index`: **243,26 / 78,43 KiB**;
- `titanDatabase`: **102,52 / 31,86 KiB**;
- `SettingsPage`: **75,85 / 20,93 KiB**;
- CSS: **29,20 / 6,21 KiB**;
- páginas de domínio restantes: aproximadamente 3,44–14,33 KiB cada.

Não existe script de testes no `package.json`, nem arquivos de teste identificados em `src/`. Assim, o resultado verde comprova análise estática e empacotamento, mas não comprova regras de negócio, migrações, restauração, comportamento offline nem fluxos de interface.

## 3. Estrutura atual da arquitetura

```text
src/
├── app/                  # composição do Router, rotas e Suspense
├── layouts/              # AppShell e navegação persistente
├── components/feedback/ # estados transversais de UI/PWA
├── shared/ui/            # Button, Card, Badge, ProgressBar e SectionTitle
├── database/             # Dexie, tipos de records, versões 1–7, data e seed
├── services/             # backup/restauração e notificações
├── modules/              # domínios funcionais
│   ├── analytics
│   ├── cardio
│   ├── coach
│   ├── dashboard
│   ├── evolution
│   ├── health
│   ├── notifications
│   ├── nutrition
│   ├── reports
│   ├── settings
│   └── training
└── styles/               # Tailwind v4, tokens e estilos globais
```

Cada módulo tende a separar `pages`, `components`, `hooks`, `data`, `types` e, quando necessário, `utils`/`engine`. Páginas consomem hooks, hooks coordenam `useLiveQuery` e repositórios, e repositórios concentram acesso ao Dexie e cálculos de agregação. Essa divisão está alinhada à arquitetura documentada e evita que a maior parte das regras fique nas telas.

O estado persistente é local e centrado em uma instância única `TitanDatabase`. O usuário e planos diários são gerados por `seedToday`; atualizações do IndexedDB propagam para a interface por `dexie-react-hooks`. Não há backend, autenticação, sincronização entre aparelhos ou camada de API.

## 4. Funcionalidades implementadas

- **Shell e navegação:** HashRouter compatível com GitHub Pages, menu inferior, fallback acessível de carregamento e rotas por domínio.
- **Dashboard:** usuário, próxima refeição, treino, cardio, métricas diárias, hidratação rápida, prioridades e Score TITAN com dados locais.
- **Nutrição:** plano diário, detalhe de refeição, registros completo/parcial/substituído/não realizado, reset, macros, pendências e hidratação.
- **Treino:** início/fim de sessão, séries com carga/repetições/RIR, remoção da última série, volume, descanso com vibração, estimativa de 1RM, recordes e sugestão de progressão.
- **Cardio:** início, conclusão e reset; duração, distância, frequência cardíaca, esforço, pace, feedback e histórico.
- **Evolução:** peso, medidas, tendência, médias/variações, exclusão, fotos, recordes de força e resumo de cardio.
- **Saúde e recuperação:** pressão, frequência cardíaca de repouso, sintomas, exames, sono diário e históricos.
- **Coach:** motor determinístico local, score explicável, insights, evidências, tendências e resumo executivo.
- **Relatórios e Analytics:** janela semanal, períodos de 7/14/30 dias, agregados, aderência, gráficos sem biblioteca externa, recordes e CSV.
- **Configurações e dados:** backup JSON versão 2, restauração confirmada, preferências locais e central de notificações.
- **PWA:** manifesto, service worker gerado, precache, fallback de navegação, cache de imagens, sinalização offline e prompt de atualização.
- **Entrega:** workflow de GitHub Pages e validador mínimo dos artefatos de release.

## 5. Funcionalidades incompletas ou divergentes da documentação

1. **Lembretes não são agendados (alta).** A central persiste preferências e permite solicitar permissão/testar uma notificação, porém não há scheduler, periodic sync, push externo ou execução baseada nos horários salvos. A limitação do navegador está documentada, mas a interface pode dar a entender que os lembretes ocorrerão.
2. **Planejamento não é configurável (alta).** Usuário, nome, metas, refeições, treino e cardio são fixos no seed (`otavio`, “Otávio”, 3.624 kcal, 220 g etc.) e repetidos todos os dias. Não há onboarding, perfil, edição de metas, montagem de treino/refeições ou dias de descanso.
3. **Histórico de treino é parcial (média).** A tela expõe séries/recordes ligados aos exercícios sem uma experiência completa de consulta a sessões anteriores; IDs de exercícios são recriados diariamente, reduzindo a continuidade por identidade do exercício.
4. **Saúde é registro simples (média).** Exames são campos textuais, sem anexos, unidades estruturadas ou agrupamento; coerente com o limite clínico, mas aquém de “exames avançados”.
5. **Backup sem importação retrocompatível (alta).** Apenas a versão literal 2 é aceita; não existe migrador para versões anteriores/futuras nem pré-visualização do conteúdo.
6. **Roadmap desatualizado (baixa).** Continua marcando Dashboard, treino, nutrição e outros módulos como pendentes, embora o changelog e o código os apresentem como entregues.
7. **Instalação PWA não é orientada (baixa).** Não há captura de `beforeinstallprompt`, CTA de instalação ou explicação de compatibilidade.

## 6. Bugs e riscos funcionais encontrados

### Alta prioridade

- **Dashboard renderiza métricas duplicadas.** `DashboardPage` monta `DailyMetricsGrid` e, mais abaixo, `MetricsGrid`; ambos mostram calorias, proteína, água e sono. Além da duplicação visual, existem dois formatadores e duas implementações do mesmo conceito.
- **Recorde pessoal fica inconsistente ao remover uma série.** Adicionar uma série pode criar um recorde; remover a última série apaga somente `exerciseSets`, sem recalcular/remover `exercisePersonalRecords`. Um recorde derivado de uma série apagada permanece em Analytics/Evolução.
- **Restauração aceita registros semanticamente inválidos.** Zod valida envelope, versão e que cada tabela é um array, mas os itens são `unknown`; campos, tipos, IDs e relações não são validados antes de limpar o banco atual.
- **Ações concorrentes podem gerar duplicatas.** Vários fluxos consultam a existência/contagem e inserem depois. Os índices compostos de “um por dia” não são únicos (`&` não é usado). Duplo clique, duas abas ou concorrência no seed podem criar planos, sessões, métricas e números de série duplicados.
- **Arquivos de foto não têm limite nem compressão.** Qualquer `image/*` é convertido integralmente em Data URL (com aumento aproximado de 33% por base64) e salvo no IndexedDB. Imagens modernas de câmera podem causar lentidão, backups enormes e `QuotaExceededError`.

### Média prioridade

- **Cálculo de datas históricas mistura fusos.** Analytics, Coach e Relatórios fazem `new Date()`, alteram o dia no fuso do ambiente e depois formatam em Manaus. Perto da virada do dia ou em dispositivos com outro fuso, a janela pode duplicar ou omitir uma data. Já existe um helper central para a data TITAN, mas ele não cobre aritmética de dias.
- **Sessão pode ser associada ao plano errado.** Consultas de treino e algumas consultas de Coach/Dashboard pegam a primeira sessão de usuário+data sem sempre filtrar `workoutPlanId`; o schema permite mais de uma. Cardio tem filtragem em alguns fluxos, mas não em todos os agregadores.
- **Validações numéricas são incompletas.** Carga, repetições, RIR, medidas, distância e frequência cardíaca nem sempre verificam `Number.isFinite`, limites coerentes ou inteiros; `NaN` pode escapar de comparações diretas em funções de repositório.
- **Pace pode formatar `:60`.** O arredondamento dos segundos pode produzir, por exemplo, `4:60 min/km`, sem transportar para `5:00`.
- **Restauração de preferências não substitui o estado por completo.** Chaves presentes no backup são escritas depois da transação, mas chaves `titan-*` atuais ausentes no backup não são removidas. Falha de `localStorage` deixa banco restaurado e preferências parcialmente restauradas.
- **Preferências de notificação não têm validação runtime.** JSON do `localStorage` é convertido por cast; valores inválidos podem chegar à UI. A lista padrão retornada sem dados também compartilha os mesmos objetos em memória.
- **URLs/ações de notificação estão incompletas.** O service worker gerado não possui handler explícito de `notificationclick` para usar `data.url`; clicar em uma notificação não garante abrir/focar a rota pretendida.
- **Erros assíncronos de fotos são silenciosos.** `void handleFile(file)` não é acompanhado por tratamento local; leitura, quota ou persistência podem rejeitar sem feedback específico.
- **Estado “carregando” mascara ausência de plano.** Hooks como treino/cardio/nutrição tratam `null` como loading permanente. O seed normalmente impede isso, mas falhas ou dados restaurados incompletos podem deixar spinner em vez de estado vazio/erro.

### Baixa prioridade

- O seed chama um plano idêntico de “Peito e tríceps” e Zona 2 em todos os dias, inclusive fins de semana, produzindo dados planejados artificiais e prejudicando taxas de aderência.
- `nextMeal` volta à primeira refeição pendente depois que todos os horários passaram, enquanto “próxima” pode ser interpretada como evento futuro.
- O CSV usa vírgula e ponto decimal implícito; planilhas em locale pt-BR podem importar colunas/números de forma incorreta.
- Não há Error Boundary; erro de renderização ou rejeição inesperada de dados pode derrubar toda a árvore da rota.

## 7. TypeScript

### Resultado

`npm run typecheck` e `tsc -b` passam sem erros. Não foram encontrados erros TypeScript bloqueantes na revisão atual.

### Lacunas de configuração/tipagem

- `strict` não está habilitado explicitamente; portanto, o projeto não obtém o conjunto completo de garantias (`strictNullChecks`, `noImplicitAny` etc.).
- `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` não estão habilitados.
- O schema de backup perde a tipagem por tabela ao usar `Record<string, unknown[]>`.
- Entradas vindas de `localStorage` usam assertion em vez de schema runtime.
- Muitos retornos de funções/hooks são inferidos. Tipos explícitos nas fronteiras de repositório/serviço melhorariam estabilidade durante a evolução do schema.
- `skipLibCheck: true` acelera o build, mas pode ocultar incompatibilidades entre declarações de dependências — aceitável no curto prazo, a ser reavaliado para v1.0.

## 8. ESLint

### Resultado

`npm run lint` passa sem erros ou warnings.

### Lacunas

- A configuração usa recomendações básicas, hooks e refresh, mas não regras TypeScript com informação de tipos (`recommendedTypeChecked`).
- Não há regras de acessibilidade JSX dedicadas, de imports/ciclos, de promises não tratadas ou de complexidade.
- O ignore global contém apenas `dist`; `.titan-backups`, artefatos de auditoria e scripts legados aumentam ruído/tempo de ferramentas que percorrem o repositório, embora a regra atual só selecione TS/TSX.
- Passar no lint não detectou promessas deliberadamente descartadas em handlers de arquivo nem os problemas de domínio listados acima.

## 9. Código duplicado

- `DailyMetricsGrid` e `MetricsGrid` implementam o mesmo conjunto de quatro métricas, com pequenas diferenças visuais.
- `addHydration` existe nos repositórios de Dashboard e Nutrição com validação e criação praticamente idênticas.
- Geração das últimas datas e formatação `America/Manaus` é repetida em Analytics, Coach e Relatórios.
- Formatação de sono, percentuais, médias e agregações de macros/hidratação aparece em múltiplos módulos.
- Padrão `seedToday` + `isReady` + `useLiveQuery` + `runAction` + normalização de erro é repetido nos hooks de Dashboard/Nutrição/Treino/Cardio.
- Consultas e montagem do mesmo snapshot diário são repetidas por Dashboard, Coach, Analytics e Relatórios, criando risco de métricas divergentes.
- Definições completas de todas as stores são repetidas em cada uma das sete versões Dexie. É normal em migrações Dexie declarar schemas, mas helpers/constantes poderiam reduzir erro de manutenção sem apagar o histórico.

## 10. Componentes e ativos não utilizados

Identificados sem referências de consumo na árvore `src/`:

- `src/components/feedback/ModulePlaceholderPage.tsx`;
- `src/modules/dashboard/components/CoachCard.tsx`;
- `src/assets/hero.png`;
- `src/assets/react.svg`;
- `src/assets/vite.svg`.

Os componentes de Dashboard chamados “CoachCard” e “CoachInsight(s)” ainda sobrepõem conceitos e nomenclatura, mesmo onde são utilizados. Recomenda-se escolher uma composição canônica antes da v1.0.

## 11. Performance

### Pontos positivos

- Rotas usam lazy loading e geram chunks separados.
- Agregações independentes geralmente usam `Promise.all`.
- `useLiveQuery` evita uma store global e atualiza somente consumidores de consultas observadas.
- Gráficos são implementados sem dependência gráfica pesada.

### Problemas

- **Consultas amplas + filtro em memória:** Analytics e Coach consultam todos os registros de um usuário por índice `userId` e depois aplicam `dates.includes`; isso cresce linearmente com todo o histórico. Faltam consultas por range em índice composto apropriado.
- **Algoritmos repetitivos:** Analytics filtra arrays completos para cada dia (`dates × registros`); um agrupamento único por `localDate` seria O(n).
- **Reatividade excessiva:** relatórios agregados refazem várias leituras e cálculos completos a qualquer alteração observada no Dexie.
- **Fotos base64:** leitura, renderização, clone entre camadas e inclusão no backup aumentam CPU, memória e armazenamento; blobs redimensionados/thumbnails seriam mais adequados.
- **Seed repetido:** múltiplas páginas chamam o seed e executam uma transação com várias consultas mesmo quando o dia já está pronto.
- **Backup carrega tudo na memória:** todas as tabelas, Data URLs e o JSON formatado coexistem antes do download; restauração também lê o arquivo inteiro.
- **Dois grids no Dashboard:** trabalho de renderização e DOM desnecessários, além do problema de UX.
- Não há paginação/virtualização nos históricos; alguns usam limites, outros carregam tudo e apenas depois ordenam/fatiam.

## 12. Lazy loading e code splitting

### Já implementado

Todas as páginas de rota são importadas com `React.lazy`, incluindo Dashboard. O build confirma chunks individuais para as páginas e alguns utilitários/ícones.

### Oportunidades

1. **Backup/Zod sob demanda:** `SettingsPage` é o chunk de página mais pesado (75,85 KiB). Importar `backupService` dinamicamente somente ao exportar/restaurar evita baixar/parsing de Zod ao abrir “Mais”.
2. **Fotos de evolução:** carregar `ProgressPhotos` apenas quando a seção entrar em viewport/for expandida; futuramente, isolar editor/processador de imagem.
3. **Gráficos e exportação:** importar `exportAnalytics` apenas no clique e separar os componentes gráficos da primeira pintura do Analytics.
4. **Coach Engine:** manter em chunk compartilhado, mas avaliar cache/memoização do snapshot para Dashboard e Coach não repetirem cálculos e consultas.
5. **Suspense granular:** um único Suspense envolve todo o roteador; boundaries por área podem preservar o shell e permitir esqueletos específicos.
6. **Vendor chunks estáveis:** considerar `manualChunks` para React/Router, Dexie e Zod somente após medir cache real; o bundle atual já cria um chunk Dexie compartilhado, portanto configuração manual sem medição pode piorar o waterfall.

**Observação importante:** o Workbox precacheia `**/*.js`; logo, na instalação/ativação do service worker, todos os chunks lazy entram nas 45 entradas do precache. O code splitting reduz parse/execução e ajuda a primeira visita anterior ao SW, mas não reduz o download total da instalação offline. Se o objetivo for offline seletivo e instalação menor, remover páginas secundárias do precache e usar cache runtime sob demanda.

## 13. IndexedDB / Dexie

### Pontos positivos

- Versões incrementais 1–7 preservam evolução do schema.
- Índices compostos atendem várias leituras diárias.
- O seed roda em transação e é conceitualmente idempotente no fluxo de uma aba.
- Restauração do conjunto de tabelas do banco ocorre em uma transação única.
- IDs UUID reduzem colisão entre registros independentes.

### Problemas e riscos

- Índices que representam invariantes não são únicos: `[userId+localDate]`, `[workoutPlanId+sequence]` e combinações de sessão/exercício permitem duplicatas.
- Não há callbacks `.upgrade()` nem testes de migração com bancos reais das versões 1–6; as mudanças atuais adicionam tabelas/índices, mas a integridade histórica não é comprovada.
- Records e tabelas ficam centralizados em um arquivo de 435 linhas, acoplando todos os módulos ao schema global.
- Identidade de exercício está ligada ao plano diário. Como o seed cria novos UUIDs todo dia, PRs e histórico por `exercisePlanId` fragmentam-se; agregações compensam parcialmente por nome, que é mutável e não é uma chave estável.
- Ausência de relações/cascade: excluir dados primários pode deixar derivados (o exemplo confirmado é recorde após exclusão da série).
- Fotos concorrem pela mesma quota do banco sem limite, thumbnail, compressão ou tratamento de quota.
- Backup não valida cada tabela, não verifica referências, não compara `databaseVersion` e não oferece rollback conjunto com `localStorage`.
- Não há política de retenção, diagnóstico de uso (`navigator.storage.estimate`) ou solicitação de armazenamento persistente (`navigator.storage.persist`).
- Agregações históricas precisam de índices por `[userId+localDate]` usados com range, evitando `filter` JavaScript sobre todo o usuário.
- Não há proteção contra duas abas executando ações simultâneas; transações e constraints devem expressar invariantes, não apenas checks prévios.

## 14. PWA

### Implementado corretamente

- `base: '/titan-app/'`, HashRouter e validação da base atendem a hospedagem atual no GitHub Pages.
- Manifesto define nome, cores, standalone, orientação, start URL e scope.
- `registerType: 'prompt'` combina com a UI de atualização e `skipWaiting: false` evita atualização silenciosa.
- Service worker gera app shell offline, limpa caches antigos e possui fallback de navegação.
- Indicadores de conexão e versão disponível existem.

### Problemas e lacunas

- O manifesto oferece somente ícones SVG `sizes: any`. Para compatibilidade ampla de instalação e atalhos, devem existir PNGs testados de 192×192 e 512×512, incluindo maskable; também falta `apple-touch-icon` no HTML.
- A validação de release só verifica existência de três arquivos e a string da base; não valida conteúdo do manifesto, ícones, escopo, service worker, navegação offline ou headers de hospedagem.
- `globPatterns` inclui todos os JS e imagens, anulando parte da economia de rede pretendida pelo lazy loading e podendo crescer sem limite funcional a cada módulo.
- O cache `CacheFirst` para qualquer request de imagem é amplo; convém restringir a origens/rotas conhecidas e revisar se imagens sensíveis externas algum dia forem adicionadas.
- Não existe handler de clique de notificação, push, sync/periodic sync ou scheduler. Preferências de horário não equivalem a lembretes entregues.
- Não há CTA/telemetria local de instalação, tratamento de falha de registro do SW, botão para dispensar update, nem estado explícito de “pronto para offline”.
- A política de atualização não comunica risco de dados não salvos antes de recarregar.
- Não há teste Lighthouse/PWABuilder nem teste automatizado offline nesta auditoria.

## 15. Qualidade, segurança e manutenção

- **Testes:** ausência total de testes unitários, de integração Dexie (com IndexedDB simulado), de componentes, E2E e migrações. É o maior déficit de confiança para v1.0.
- **CI:** o workflow deve continuar usando instalação reprodutível (`npm ci`) e a validação completa; convém adicionar testes e auditorias de bundle/PWA.
- **Privacidade:** dados de saúde e fotos ficam sem criptografia no perfil do navegador e no backup JSON. A afirmação “local” é correta, mas é necessário explicar proteção do aparelho, caráter não criptografado e responsabilidade do arquivo exportado.
- **Acessibilidade:** há bons `aria-label`, `aria-live`, estados textuais e alvos grandes, mas falta auditoria automatizada/manual; inputs/selects e contraste precisam ser testados, não apenas inferidos.
- **Documentação:** arquitetura está curta demais para schema, fluxos e decisões; roadmap conflita com changelog; faltam matriz de suporte e procedimento de recuperação.
- **Observabilidade:** erros são convertidos em mensagens genéricas ou podem virar rejeições não tratadas; não há log local estruturado/diagnóstico exportável.
- **Dependências:** `npm ci` reportou `glob@11.1.0` transitivo depreciado e um warning ambiental de `http-proxy`; deve-se identificar a cadeia antes do release, sem atualizar major versions às cegas.

## 16. Recomendações priorizadas

### P0 — bloqueiam v1.0

1. Criar suíte mínima de testes para cálculos, Coach, repositórios e fluxos críticos; adicionar testes de integração de backup/restauração e migração Dexie v1→v7.
2. Definir schemas Zod por tabela, validar todo o backup antes de qualquer `clear`, checar versão/relações e tornar a restauração de preferências previsível; incluir teste de rollback.
3. Corrigir duplicidade do Dashboard e consolidar os dois grids e o registro de hidratação.
4. Corrigir integridade de treino: transação para série+PR, recálculo ao remover série e identidade estável de exercício.
5. Impor limites, tipo/tamanho, redimensionamento e compressão de fotos; tratar quota com feedback e documentar/exportar de modo escalável.
6. Tornar explícito que lembretes não são agendados ou implementar uma estratégia suportada; não prometer comportamento que a plataforma atual não executa.

### P1 — alta prioridade para RC final

1. Adicionar constraints/índices únicos e transações atômicas para invariantes diários, com migração de deduplicação antes de ativá-los.
2. Centralizar aritmética de datas em Manaus e testar virada do dia, mês, ano e dispositivos em outros fusos.
3. Fortalecer validações numéricas/runtime e corrigir o carry de segundos do pace.
4. Otimizar consultas históricas com ranges/índices e agrupamento em uma passagem; medir com volume representativo.
5. Adicionar PNG 192/512 e maskable, `apple-touch-icon`, handler de clique e testes reais de instalação/offline/update.
6. Implementar Error Boundary e estados distintos de loading, vazio e erro.
7. Habilitar TypeScript `strict` progressivamente e ESLint type-aware/`no-floating-promises`; incluir checagem de acessibilidade.

### P2 — qualidade e performance

1. Importar backup/Zod e exportadores dinamicamente; medir bundle antes/depois e definir orçamento por chunk.
2. Decidir conscientemente entre precache total e cache sob demanda das rotas lazy.
3. Extrair serviço de snapshot/agregações diárias compartilhado por Dashboard, Coach, Relatórios e Analytics.
4. Paginar históricos e criar thumbnails; avaliar Web Worker/streaming para backups grandes.
5. Remover componentes/ativos não usados e scripts/backups legados do repositório ou movê-los para armazenamento externo.
6. Atualizar Roadmap, Arquitetura, política de privacidade local, matriz de navegadores e limitações de notificações.
7. Investigar a dependência transitiva depreciada e manter lockfile/CI reprodutíveis.

## 17. Critérios sugeridos de saída para v1.0

- `npm ci`, lint, TypeScript, testes, build e validação PWA verdes no CI.
- Migração validada a partir de todas as versões de banco publicadas e restauração testada com dados corrompidos, incompletos e grandes.
- Zero bugs P0/P1 abertos; fluxos essenciais validados em duas abas e após reload/offline/update.
- Lighthouse/PWABuilder e testes manuais em pelo menos Chrome/Android e Safari/iOS documentados.
- Orçamento de bundle e tempo de consulta definidos com histórico/fotos representativos.
- Documentação e UI alinhadas sobre escopo local, backup, privacidade, instalação e limitações de lembretes.

## 18. Conclusão

A arquitetura modular existente deve ser preservada. Ela é adequada à v1.0 e já entrega boa parte da proposta local-first. O próximo ciclo deve priorizar confiabilidade e coerência — testes, integridade do Dexie, backup seguro, PWA verificável e remoção de duplicações — em vez de novos módulos. Após os P0 e P1, o TITAN terá uma base significativamente mais segura para ser declarado estável.
