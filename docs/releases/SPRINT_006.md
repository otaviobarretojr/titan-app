# Sprint 006 — Validação dos testes

## Qualidade antes do merge

- Vitest adicionado às dependências de desenvolvimento.
- Suíte automatizada do módulo Cardio preparada para `npm run test`.
- Validação completa disponível em `npm run validate`.
- A aprovação final deve ser registrada somente depois de `npm install`,
  `npm run test` e `npm run validate` terminarem com sucesso.

Na execução de 4 de agosto de 2026, o registry respondeu com HTTP 403 ao
download do Vitest. Por isso, os testes não foram registrados como aprovados.
