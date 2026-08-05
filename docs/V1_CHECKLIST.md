# TITAN v1.0.0 — Checklist Final

**Data:** 5 de agosto de 2026  
**Versão:** 1.0.0  
**Ambiente:** produção PWA/GitHub Pages  
**Autor:** Otávio Barreto Jr.

## Release engineering

- [x] `package.json` atualizado para `1.0.0`.
- [x] `package-lock.json` atualizado para `1.0.0`.
- [x] Manifest/metadata/release name revisados.
- [x] Tag lógica documentada: `v1.0.0`.

## Validação funcional

- [x] Instalação PWA documentada para Android/Chrome, Edge e iOS/Safari.
- [x] Abertura inicial preservada via seed local e rotas lazy.
- [x] Offline validável via Service Worker de produção.
- [x] Backup JSON local preservado.
- [x] Restauração com confirmação preservada.
- [x] Treino preservado.
- [x] Refeições preservadas.
- [x] Notificações com permissão explícita e Inbox local preservadas.
- [x] Analytics local preservado.
- [x] Coach local e explicável preservado.
- [x] Exportações JSON/CSV/PDF preservadas.

## PWA e produção

- [x] Build production obrigatório.
- [x] Manifest com nome, descrição, tema, escopo, start URL e ícones.
- [x] Service Worker gerado por Workbox.
- [x] Cache de navegação e imagens documentado.
- [x] Splash/metadados mobile revisados no HTML.

## Performance

- [x] Lazy loading por rotas preservado.
- [x] Code splitting preservado.
- [x] Memoização do shell documentada.
- [x] Bundle revisado pelo build de produção.
- [x] Sem novas dependências de runtime.

## Limitações conhecidas

- [x] Notificações em segundo plano dependem do navegador.
- [x] Backup em nuvem é manual/opcional.
- [x] Itens do TITAN 2.0 não foram iniciados.

## v1.0.1 — Primeiro Acesso e Integridade do Score

- Corrige a origem do Score inicial 20/100: planos `planned` não contam mais como execução real.
- Instalações novas não recebem dados demonstrativos automaticamente em produção.
- O Dashboard exibe “Sem dados suficientes” até haver evidências reais suficientes.
- A atualização preserva dados locais existentes; para limpar dados locais, faça backup e confirme manualmente a remoção no navegador/sistema.


## v1.0.2
- [x] Fluxo de atualização com reload único.
- [x] Recuperação de erro de chunk documentada.
- [x] IndexedDB preservado.

## v1.0.3 — Perfil, Planos e Configurações

- Configuração inicial com perfil editável e opções de Projeto TITAN/backup.
- Planos independentes para treino, nutrição, cardio e suplementação, separados de execução e histórico.
- Formatos TITAN autoidentificáveis e validação segura antes de qualquer alteração.
- Central “Conta e configurações” com perfil, planos/importações, aparência, atualizações, novidades, dados e Sobre.
- Migração Dexie aditiva para `userProfile`, `activePlans`, `importHistory` e `appPreferences`.
