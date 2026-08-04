# TITAN

Sistema operacional de performance pessoal, mobile-first e instalável como PWA.

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

Os registros permanecem no IndexedDB do navegador. Exporte backup antes de limpar dados ou trocar de aparelho.

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
