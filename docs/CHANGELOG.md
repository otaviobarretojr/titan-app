# TITAN — Changelog

## Unreleased

### Sprint 013 — Analytics e Relatórios

- Analytics mobile-first com filtros de 7, 30, 90 dias e 1 ano.
- Gráficos de Score TITAN, peso, medidas, força, proteína, água, calorias e sono.
- Timeline do Coach alimentada pelas recomendações persistidas no IndexedDB.
- Relatórios semanais e mensais em PDF e exportação local em JSON, CSV e PDF.

### Sprint 012 — Dashboard Inteligente

- Home redesenhada em padrão mobile-first inspirado no Samsung One UI, com hierarquia de leitura mais clara.
- Score TITAN em destaque e apenas a recomendação prioritária do Coach.
- Cards inteiramente clicáveis para refeição, treino, pendências e resumo diário, com estados operacionais explícitos.
- Barra inferior fixa e FAB com atalhos de registro rápido, incluindo hidratação de 300 ml.

### Sprint 011 — Coach TITAN Intelligence

- Engine local de insights e alertas explicáveis, com priorização e controle de duplicidade.
- Tendências de 7, 30 e 90 dias, Timeline TITAN e novos cards do dashboard.
- Estados de dados insuficientes sem inferir registros ausentes.

### Sprint 010 — TITAN Experience

- Dashboard inteligente em cards reordenáveis com agenda, pendências, peso, água, sono, treino, cardio, Coach e Score TITAN.
- Componentes reutilizáveis para vazio, carregamento, estatísticas, cabeçalhos, banners e confirmação.
- Skeletons estáveis, feedback acessível, foco visível e transições compatíveis com redução de movimento.
- Design system consolidado para superfícies, controles, espaçamento, tipografia, sombras e estados.

### Sprint 009 — Evolução Corporal Avançada

- Médias e comparações de peso sem zeros artificiais, medidas bilaterais e cobertura de registros.
- Bioimpedância opcional com contexto e schema Dexie 10 aditivo.
- Fotos WebP otimizadas, quatro poses, filtros e exclusões confirmadas.
- Força recalculada a partir de séries existentes e métricas semanais de cardio.

### Added
- Design System inicial.
- Biblioteca de componentes reutilizáveis.
- Dashboard Premium modular.
- Score TITAN demonstrativo.

## Sprint 003

### Added

- IndexedDB com Dexie.
- Seed diário idempotente.
- Dashboard alimentado por dados locais.
- Registro rápido de hidratação.
- Score com estado de dados insuficientes.

### Changed

- Removidos valores demonstrativos tratados como se fossem registros reais.

## Sprint 004

### Added

- Módulo de nutrição.
- Lista e detalhe das refeições.
- Estados planejada, pendente, parcial, concluída, substituída e não realizada.
- Registro persistente no IndexedDB.
- Resumo nutricional reativo.

## Sprint 005

### Added

- Módulo de treino.
- Sessões de treino persistentes.
- Registro individual de séries.
- Carga, repetições e RIR.
- Progresso e conclusão do treino.
- Schema 2 do IndexedDB.

## Sprint 006

### Added

- Módulo de Cardio.
- Sessões de caminhada, Zona 2, corrida e HIIT.
- Registro de duração, distância, FC média e esforço percebido.
- Schema 3 do IndexedDB.

## Sprint 007 — Analytics Executivo

### Added

- Dashboard executivo local com tendências semanais e mensais.
- Score TITAN histórico, streaks, consistência, cobertura e comparativos.
- Nove gráficos de performance e testes unitários da engine de Analytics.

## Sprint 007

### Added

- Módulo de evolução corporal.
- Registro de peso e medidas.
- Média recente e variação de peso.
- Histórico persistente.
- Schema 4 do IndexedDB.

## Sprint 008

### Added
- Coach Engine.
- Prioridades dinâmicas.
- Estrutura para Score TITAN.

## Sprint 009

### Added

- Configuração PWA.
- Service Worker e cache do App Shell.
- Estado offline e atualização disponível.
- Backup e restauração.
- Página de configurações.

## Sprint 010

### Added

- Coach Engine funcional.
- Score TITAN calculado com dados reais.
- Prioridades dinâmicas.
- Dashboard integrado com cardio, treino, nutrição, água e sono.

## Sprint 011

### Added

- Registro de sono.
- Página de recuperação.
- Permissão e teste de notificações PWA.
- Configuração local de lembretes.

## Sprint 012

### Added

- Relatórios semanais.
- Médias de consumo, hidratação e sono.
- Indicadores de consistência.
- Linha diária dos últimos sete dias.

## Feature Treino Premium

### Added

- Cronômetro de descanso.
- Volume total.
- Recordes pessoais.
- 1RM estimado.
- Sugestão automática de progressão.
- Histórico de séries por exercício.
- Schema 5 do IndexedDB.

## Feature Nutrição Premium

### Added

- Registro parcial ajustável.
- Macros restantes.
- Hidratação rápida.
- Progresso por refeição.
- Resumo nutricional ampliado.

## Feature Cardio Premium

### Added

- Pace automático.
- Feedback por tipo de cardio.
- Histórico de sessões.
- Métricas detalhadas.

## Dashboard + Coach Premium

### Added

- Lista de prioridades.
- Composição detalhada do Score TITAN.
- Resumo diário ampliado.
- Recomendações contextuais.

## Feature Evolução Premium

### Added

- Fotos de evolução.
- Tendência de peso.
- Variação de cintura.
- Recordes de força.
- Resumo acumulado de cardio.
- Schema 6 do IndexedDB.

## Feature Saúde e Recuperação Premium

### Added

- Registro de pressão arterial.
- Frequência cardíaca de repouso.
- Sintomas.
- Exames.
- Histórico de saúde.
- Schema 7 do IndexedDB.

## Notificações, Offline e Backup Premium

### Added

- Central de notificações.
- Preferências de lembretes.
- Backup versão 2.
- Exportação de preferências locais.
- Cache offline aprimorado.

## Coach Inteligente Premium

### Added

- Tela dedicada do Coach.
- Score com consistência.
- Evidências por recomendação.
- Tendências semanais.
- Resumo executivo.

## Analytics Premium

### Added

- Tela Analytics.
- Indicadores por período.
- Gráficos de proteína, água e calorias.
- Recordes pessoais.
- Exportação CSV.

## v0.9.0-rc.1

### Changed

- Rotas agora usam lazy loading e code splitting.
- Bundle inicial reduzido.
- Adicionado fallback acessível durante carregamento dos módulos.
