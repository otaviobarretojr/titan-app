# Sprint 007 — Analytics Executivo

## Objetivo

Consolidar a performance pessoal em uma visão executiva, privada e offline, usando exclusivamente registros persistidos no IndexedDB.

## Entregas

- Dashboard mobile-first com Score TITAN médio, streak atual/recorde, consistência e cobertura.
- Tendências semanais e mensais, comparativos contra os períodos anteriores e cards de evolução.
- Histórico diário do Score TITAN e gráficos de peso, cintura, proteína, calorias, água, sono, treino e cardio.
- Recordes pessoais de força e exportação CSV.
- Períodos de 30, 90 e 180 dias, reativos a alterações no banco local.
- Engine funcional isolada da interface e coberta por testes unitários.

## Dados e privacidade

O repositório executa uma única transação de leitura nas tabelas locais necessárias. Não existem chamadas HTTP, SDKs de telemetria ou sincronização remota. Dias sem registros permanecem identificados como sem cobertura e não são convertidos em resultados fictícios.

## Score e indicadores

O Score diário combina aderência de calorias, proteína, hidratação, sono, treino e cardio quando há plano e evidência registrada. Tendências agregam o Score por semana e mês. Comparativos usam janelas consecutivas de 7 e 30 dias; quando a amostra é insuficiente, a interface exibe um estado explícito.

## Validação

Execute `npm run validate`. A validação inclui lint, TypeScript, testes Vitest, build PWA e inspeção dos artefatos de release.
