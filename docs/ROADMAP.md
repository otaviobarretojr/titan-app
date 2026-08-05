# TITAN — Roadmap
- [x] v0.1 — Foundation
- [x] v0.2 — Dashboard
- [x] v0.3 — Treinos
- [x] v0.4 — Nutrição
- [x] v0.5 — Cardio
- [x] v0.6 — Saúde e evolução
- [x] v0.7 — Coach
- [x] v0.8 — Relatórios
- [x] v0.9 — Polimento
- [x] Sprint 013 — Analytics e Relatórios
- [x] Sprint 008 — Plataforma PWA e Confiabilidade
- [x] Sprint 009 — Evolução Corporal Avançada
- [x] Sprint 010 — TITAN Experience (UX Premium)
- [x] Sprint 011 — Coach TITAN Intelligence
- [x] Sprint 012 — Dashboard Inteligente
- [x] Sprint 013.1 — Estabilização da Plataforma
- [x] Sprint 014 — Notificações Inteligentes
- [x] Sprint 015 — Backup em Nuvem e Sincronização Segura
- [x] Sprint 016 — Experiência Premium (UX/UI)
- [x] Sprint 017 — Auditoria Completa e Beta
- [x] v1.0 — Primeira versão estável (TITAN v1.0.0 — 5 de agosto de 2026)
- [ ] v2.0 — Health Connect, Galaxy Watch, IA Conversacional, Multiusuário, Sincronização automática e Portal Personal Trainer

## v1.0.1 — Primeiro Acesso e Integridade do Score

- Corrige a origem do Score inicial 20/100: planos `planned` não contam mais como execução real.
- Instalações novas não recebem dados demonstrativos automaticamente em produção.
- O Dashboard exibe “Sem dados suficientes” até haver evidências reais suficientes.
- A atualização preserva dados locais existentes; para limpar dados locais, faça backup e confirme manualmente a remoção no navegador/sistema.


## v1.0.2
- [x] Atualização segura do PWA e recuperação sem apagar dados locais.

## v1.0.3 — Perfil, Planos e Configurações

- Configuração inicial com perfil editável e opções de Projeto TITAN/backup.
- Planos independentes para treino, nutrição, cardio e suplementação, separados de execução e histórico.
- Formatos TITAN autoidentificáveis e validação segura antes de qualquer alteração.
- Central “Conta e configurações” com perfil, planos/importações, aparência, atualizações, novidades, dados e Sobre.
- Migração Dexie aditiva para `userProfile`, `activePlans`, `importHistory` e `appPreferences`.
