# Sprint 008 — Plataforma PWA e Confiabilidade

## Entregas

- Instalação PWA com captura de `beforeinstallprompt`, detecção de modo standalone e orientação específica para iOS.
- Manifesto em português, portrait e standalone, com ícones SVG existentes e metadados Apple.
- Atualização controlada do Service Worker, aviso de versão, estado offline, limpeza de caches e estratégias de runtime.
- Central de Notificações para refeições, água, treino, pré-treino, sono e resumos diário e semanal.
- Backup JSON v2 com resumo prévio, confirmação, compatibilidade de tabelas e restauração transacional.
- Diagnóstico de uso, quota aproximada, persistência, registros e fotos.

## Limitações conhecidas

- O evento `beforeinstallprompt` não é padronizado em todos os navegadores. No iOS, a instalação é manual pelo Safari.
- SVGs existentes são usados como ícones porque a sprint não adiciona binários; algumas versões antigas do iOS podem preferir um ícone PNG.
- A Storage API fornece estimativas e pode não expor quota ou persistência.
- Sem um servidor de push, navegadores móveis podem suspender a aplicação e não garantem lembretes agendados em segundo plano.
- Dados e preferências são locais ao perfil do navegador; exporte o backup antes de limpar o site.

## Recuperação e integridade

O arquivo inteiro é lido e validado antes da confirmação. A restauração do IndexedDB ocorre em uma única transação Dexie: se qualquer inclusão falhar, a transação é revertida, sem apagar parcialmente o banco anterior.
