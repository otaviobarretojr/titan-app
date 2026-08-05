# Plan Import Safety

A importação TITAN v1.0.3 é segura por desenho:

1. O texto é parseado como JSON antes de qualquer escrita.
2. O envelope canônico `schema: "TITAN"` e `schemaVersion: "1.0"` é validado com Zod.
3. O payload é validado profundamente, incluindo refeições, exercícios, suplementação, datas ISO e horários.
4. A gravação ocorre dentro de uma transação Dexie envolvendo `userProfile`, `activePlans`, `importHistory` e `appPreferences`.
5. Qualquer falha intermediária aborta a transação e restaura o estado anterior.

Importações por módulo apagam e substituem somente o tipo selecionado dentro de `activePlans`. Assim, nutrição preserva treino e treino preserva nutrição. Módulos não importados, histórico legado e registros diários antigos permanecem intactos.
