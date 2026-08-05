# TITAN — Arquitetura

- `app`: inicialização, rotas e providers.
- `shared`: componentes reutilizáveis.
- `modules`: funcionalidades por domínio.
- `database`: persistência local.
- `services`: serviços transversais.
- `styles`: tokens e estilos globais.

## Camada de experiência

- `shared/ui` concentra as primitivas visuais e os estados reutilizáveis (`EmptyState`, `LoadingCard`, `StatCard`, `SectionHeader`, `InfoBanner` e `ConfirmDialog`).
- O dashboard compõe cards independentes por uma lista de ordem declarativa, permitindo reorganização futura sem misturar regras de domínio à tela.
- Rotas continuam carregadas sob demanda e usam transições CSS progressivas; `prefers-reduced-motion` desativa movimento não essencial.
- Estados do dashboard são derivados exclusivamente das consultas reativas ao IndexedDB. Nenhuma API externa ou estado remoto foi introduzido.

Regra principal: componentes de tela não concentram regras de negócio.

## Plataforma local

- `services/pwa`: detecção segura de instalação e diferenças do iOS.
- `services/notifications`: permissão sob ação do usuário e preferências persistidas.
- `services/backup`: envelope JSON compatível com o backup local e restauração transacional do IndexedDB.
- `services/cloudBackup`: Sprint 015 separa `cloudAuthService`, `cloudBackupService`, `backupSerializer`, `backupValidator`, `backupRepository` e `deviceIdentityService`; a UI não acessa Supabase diretamente.
- `services/storage`: estimativas da Storage API e contagens do IndexedDB.
- `modules/evolution`: regras puras de médias por janela, comparações, validação, métricas de força/cardio e processamento local de fotos. A UI não fabrica amostras ausentes.
- O schema Dexie 10 adiciona `bioimpedance` e campos opcionais a medições/fotos. A evolução usa leitura adaptativa dos schemas anteriores e recordes de força derivados das séries existentes.
- O Workbox usa precache, `NetworkFirst` para navegação e `CacheFirst` limitado para imagens, respeitando a base `/titan-app/` do GitHub Pages.

## Sprint 013.1 — Estabilização

- `layouts/AppShell` mantém a navegação mobile e delega ações rápidas a uma composição isolada, com callbacks estáveis e navegação memoizada para reduzir renders não essenciais.
- A integridade local é validada por testes do contrato Dexie: versão 10, tabelas críticas e índices compostos usados por consultas offline.
- O ciclo PWA permanece explícito: registro em modo `prompt`, limpeza de caches obsoletos, navegação `NetworkFirst` e cache de imagens `CacheFirst` com expiração.

## Coach TITAN Intelligence

- `modules/coach/engine` contém regras puras e determinísticas de insights, alertas, priorização, tendências e timeline.
- `coachRepository` é a fronteira de dados: agrega exclusivamente tabelas locais do Dexie, persiste recomendações e aplica cooldown antirrepetição.
- Janelas de 7, 30 e 90 dias ignoram ausências e exigem duas ou mais amostras; explicações carregam evidência, período e tamanho da amostra.

## Sprint 014 — Notificações Inteligentes

- `modules/notifications/utils/notificationEngine.ts` concentra o cálculo determinístico de lembretes sem efeitos colaterais.
- `modules/notifications/data/notificationsRepository.ts` é a fronteira IndexedDB para preferências, Inbox local e snapshots dos dados existentes.
- `services/notifications` trata suporte, permissão explícita, entrega via Notification API e fallback para Inbox persistente.
- O schema Dexie 11 adiciona `notificationPreferences` e `notificationInbox` de forma aditiva, mantendo dados antigos compatíveis.
- O hook do AppShell verifica lembretes com o app aberto e no retorno ao primeiro plano, sem prometer execução em segundo plano.


## Sprint 015 — Backup em Nuvem

O IndexedDB permanece como fonte operacional principal. Supabase é usado apenas para Auth, Storage de arquivos JSON e metadados de backups manuais quando configurado por variáveis de ambiente públicas. O modo sem configuração ou offline preserva o uso local e não cria filas automáticas. Restaurações em nuvem validam estrutura, versão, checksum, tabelas e contagens antes de criar snapshot local e substituir dados em transação.

## Sprint 016 — Experiência Premium

- `styles/globals.css` concentra tokens reutilizáveis de UX premium para superfícies, bordas, radius, espaçamento, elevação, foco e movimento.
- `shared/ui/SkeletonPage` padroniza skeleton loading para Dashboard, Coach, Analytics, Evolução, Notificações e Conta, reduzindo instabilidade visual sem consultar novas fontes de dados.
- `layouts/AppShell` mantém navegação e FAB como camada de shell, com indicador ativo, ações rápidas, feedback de hidratação e callbacks estáveis.
- Rotas continuam em `React.lazy`/`Suspense`, preservando code splitting por módulo e carregamento sob demanda.
- A Sprint não altera regras de negócio, contratos públicos nem schema IndexedDB; as mudanças ficam restritas à apresentação, performance percebida e acessibilidade.

## Sprint 017 — Auditoria Beta

- A Sprint 017 não altera fronteiras de arquitetura, contratos públicos, regras de negócio nem schema IndexedDB.
- A auditoria confirma IndexedDB como fonte operacional principal, Supabase como camada opcional/manual de backup e Service Worker como infraestrutura de PWA offline-first.
- Correções aplicadas permanecem na camada de apresentação/acessibilidade: labels em fotos de evolução, semântica de status e dialog modal de restauração em nuvem.
- `docs/BETA_CHECKLIST.md` concentra o checklist de publicação, riscos conhecidos e pendências para v1.0.

## Sprint 018 — TITAN v1.0.0

- A Sprint 018 é uma release oficial: não adiciona funcionalidades, não altera contratos públicos e não altera schemas IndexedDB.
- Metadados oficiais: versão `1.0.0`, data `5 de agosto de 2026`, tag lógica `v1.0.0`, ambiente GitHub Pages/PWA, licença Proprietary e autor Otávio Barreto Jr.
- A arquitetura validada para v1.0 mantém IndexedDB/Dexie como fonte operacional, Supabase opcional/manual para backup, PWA via Workbox e rotas `React.lazy`/`Suspense` para code splitting.
- Validação final cobre produção, manifesto, Service Worker, cache, offline, backup/restauração, treino, refeições, notificações, analytics, Coach e exportações.
