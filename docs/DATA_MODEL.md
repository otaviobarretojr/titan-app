# Modelo de Dados v1.0.3

A migração Dexie v12 é aditiva e compatível com v1.0.2. As tabelas antigas permanecem intactas.

Novas tabelas:
- `userProfile`: dados do usuário.
- `activePlans`: planos independentes de `workout`, `nutrition`, `cardio` e `supplements`.
- `importHistory`: histórico sanitizado de importações.
- `appPreferences`: tema, onboarding e preferências.

Separação lógica: Perfil contém dados do usuário; Planos contêm planejamento ativo; Execução permanece nas tabelas legadas de registros reais; Histórico contém eventos passados; Preferências contém configuração do app.
