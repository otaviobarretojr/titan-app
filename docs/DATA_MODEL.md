# Data Model

## Tabelas canônicas da importação v1.0.3

- `userProfile`: perfil atual do usuário, indexado por `id`.
- `activePlans`: planos ativos por `type`, com `nutrition`, `training` e `supplementation` no mesmo contrato versionado.
- `importHistory`: trilha de auditoria de cada arquivo TITAN importado, módulos aplicados e tabelas tocadas.
- `appPreferences`: preferências tipadas por chave.

## Relação com tabelas antigas

As tabelas existentes (`mealPlans`, `workoutPlans`, `exercisePlans`, entradas de treino, nutrição, saúde, analytics e notificações) continuam preservadas para histórico e telas existentes. A importação de release não escreve nelas para não misturar `activePlans` com contratos antigos sem decisão arquitetural explícita.

Suplementação passa a ter persistência real por registros `activePlans` com `type: "supplementation"`, em vez de depender apenas de lembretes ou estruturas temporárias.
