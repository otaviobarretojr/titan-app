# TITAN

Sistema operacional de performance pessoal, mobile-first e instalável como PWA.


## Release oficial — v1.0.0

O TITAN v1.0.0 é a primeira versão oficial do app. A release consolida a base local-first/offline-first, PWA instalável, IndexedDB como fonte principal, backup local, backup em nuvem manual/opcional, Analytics, Coach, notificações, exportações e documentação de uso/instalação.

**Metadados:** versão `1.0.0`, data `5 de agosto de 2026`, tag lógica `v1.0.0`, ambiente GitHub Pages/PWA, licença Proprietary, autor Otávio Barreto Jr. Consulte `docs/releases/V1_0_0.md`, `docs/USER_GUIDE.md`, `docs/INSTALLATION.md`, `docs/PROJECT_HISTORY.md` e `docs/V1_CHECKLIST.md`.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação completa

```bash
npm run validate
```

## Publicação

Todo push para `main` executa validação e publicação automática no GitHub Pages.

URL esperada:

```text
https://otaviobarretojr.github.io/titan-app/
```

## Dados

Os registros permanecem no IndexedDB do navegador. Exporte backup antes de limpar dados ou trocar de aparelho. A rota `/account` adiciona backup manual em nuvem opcional via Supabase quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas; sem configuração ou offline, o app e o backup local continuam funcionando.

## PWA e confiabilidade

O TITAN pode ser instalado pelo botão **Instalar TITAN**. No iOS, use Safari → Compartilhar → Adicionar à Tela de Início. A área **Mais** reúne backup JSON versionado, diagnóstico de armazenamento e a Central de Notificações. Notificações são solicitadas somente após ação explícita e lembretes em segundo plano dependem das restrições do navegador.

## Analytics Executivo

A rota `/analytics` consolida tendências, Score TITAN, streaks, cobertura e recordes exclusivamente a partir do IndexedDB. Consulte `docs/releases/SPRINT_007_ANALYTICS.md` para detalhes.

## Evolução Corporal Avançada

A rota `/evolution` reúne peso e tendência, medidas bilaterais, bioimpedância opcional, fotos otimizadas, força derivada das séries existentes e cardio semanal. Nenhum dia ausente é tratado como zero e nenhuma medida é inferida. Consulte `docs/releases/SPRINT_009_EVOLUCAO_AVANCADA.md`.

## TITAN Experience

O dashboard mobile-first organiza Score, agenda, refeições pendentes, treino, cardio, Coach, peso, água e sono em cards independentes. Skeletons, estados explícitos, foco visível e animações que respeitam redução de movimento tornam a experiência estável sem alterar o modelo offline-first ou a persistência no IndexedDB. Consulte `docs/releases/SPRINT_010_TITAN_EXPERIENCE.md`.

## Coach TITAN Intelligence

O Coach analisa somente evidências armazenadas no IndexedDB, compara janelas de 7, 30 e 90 dias e apresenta alertas, próxima ação e Timeline TITAN. Sem amostra suficiente, o app informa a limitação em vez de inferir dados. Consulte `docs/releases/SPRINT_011_COACH_INTELLIGENCE.md`.

## Dashboard Inteligente

A Home segue uma experiência mobile-first inspirada no Samsung One UI: Score TITAN destacado, uma recomendação prioritária do Coach, estados claros de refeição e treino, pendências, resumo diário e cards totalmente acionáveis. A navegação inferior permanece fixa e o FAB permite registrar água ou acessar rapidamente os módulos. Consulte `docs/releases/SPRINT_012_DASHBOARD_INTELIGENTE.md`.

## Estabilização da Plataforma — Sprint 013.1

A Sprint 013.1 estabiliza a base sem novas funcionalidades: refatora o shell mobile, reforça testes de schema Dexie/IndexedDB, revisa contratos do Service Worker e documenta caches, atualização PWA e integridade offline. Consulte `docs/releases/SPRINT_013_1_ESTABILIZACAO_PLATAFORMA.md`.

## Analytics e Relatórios — Sprint 013

A rota `/analytics` oferece filtros de 7, 30, 90 dias e 1 ano, gráficos de Score TITAN, composição corporal, força, nutrição, hidratação e sono, além da Timeline do Coach. Relatórios semanais e mensais e exportações JSON, CSV e PDF são gerados localmente a partir do IndexedDB. Consulte `docs/releases/SPRINT_013_ANALYTICS_RELATORIOS.md`.

## Notificações Inteligentes

A rota `/notifications` reúne preferências locais, Inbox persistente, próximos lembretes e teste manual da Notification API. O app verifica lembretes aberto, ao iniciar e ao voltar ao primeiro plano; notificações de sistema dependem de permissão explícita e não são garantidas em segundo plano sem Push API. Consulte `docs/releases/SPRINT_014_NOTIFICACOES_INTELIGENTES.md`.


## Backup em Nuvem — Sprint 015

O backup em nuvem é opcional, manual e associado à conta autenticada. Ele armazena um JSON validado no Supabase Storage e metadados mínimos em tabela protegida por RLS. Fotos de evolução são excluídas por padrão do backup em nuvem, não há sincronização automática bidirecional e restaurações exigem confirmação explícita. Consulte `docs/CLOUD_BACKUP_SETUP.md`, `docs/SUPABASE_RLS.md` e `docs/releases/SPRINT_015_BACKUP_NUVEM.md`.

## Experiência Premium — Sprint 016

A Sprint 016 refina a experiência visual do TITAN com design system tokenizado, dark premium, skeleton loading nas rotas principais, microinterações discretas, navegação com indicador ativo, foco visível e transições que respeitam `prefers-reduced-motion`. Não altera regras de negócio, APIs públicas nem schemas do IndexedDB. Consulte `docs/releases/SPRINT_016_EXPERIENCIA_PREMIUM.md`.

## Beta — Sprint 017

A Sprint 017 consolida a auditoria beta pré-v1.0: fluxos funcionais, UX, performance, PWA, acessibilidade, segurança, documentação e riscos conhecidos. A entrega não adiciona funcionalidades nem altera schemas IndexedDB; corrige apenas inconsistências de acessibilidade identificadas na auditoria. Consulte `docs/BETA_CHECKLIST.md` e `docs/releases/SPRINT_017_BETA.md`.
