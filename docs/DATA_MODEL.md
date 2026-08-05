# Modelo de Dados v1.0.3

## Novas tabelas
- `userProfile`: perfil único do usuário local.
- `activePlans`: planos ativos por tipo `workout`, `nutrition`, `cardio` ou `supplements`.
- `importHistory`: auditoria de importações concluídas e falhas sanitizadas.
- `appPreferences`: tema e estado do onboarding.

Tabelas antigas continuam preservadas para execução e histórico legado, mas a importação v1.0.3 não escreve nelas. Plano ativo não cria execução, não conclui registro e não pontua Score.
