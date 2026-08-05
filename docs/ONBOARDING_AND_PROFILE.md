# Onboarding e Perfil

Sem perfil, o TITAN apresenta “Bem-vindo ao TITAN” e permite criar perfil, importar Projeto TITAN, restaurar backup ou continuar depois. Continuar depois grava `onboardingStatus: "deferred"` em `appPreferences`, permite acessar o Dashboard em estado vazio e não reabre o onboarding a cada inicialização.

O perfil editável contém nome, nome de exibição, altura, peso, objetivo, experiência, dias de treino, horários de acordar, trabalho, treino e sono, timezone, metas e preferências. Edições preservam `createdAt` e atualizam apenas `updatedAt`.
