# Sprint 014 — Notificações Inteligentes

## Entregas

- Nova rota `/notifications` com status de suporte, permissão, detecção de PWA, lembretes ativos, próximos lembretes e histórico local.
- Preferências persistidas no IndexedDB para refeições, refeições atrasadas, hidratação, treino, pré-treino, sono, suplementos, relatório semanal e prioridade do Coach.
- Inbox local com contador de não lidas, leitura, descarte, abertura de destino, limpeza de avisos antigos e deduplicação por chave.
- Engine determinística para calcular lembretes futuros e avisos devidos usando apenas planos, registros e recomendações locais.
- Verificação quando o app está aberto, ao abrir e ao voltar ao primeiro plano.

## Permissão e UX

A permissão do navegador nunca é solicitada automaticamente. O usuário precisa tocar no botão da central. Quando a permissão está negada, o TITAN orienta a alteração manual no navegador e mantém avisos internos na Inbox.

## Limitações conhecidas

Notificações de sistema dependem da Notification API, permissão concedida e contexto permitido pelo navegador. PWAs não garantem timers em segundo plano; por isso, a Inbox local é a fonte confiável quando o app for suspenso.

## Preparação futura

O modelo separa preferências, candidatos e entrega para permitir integração futura com Push API, sem backend nesta sprint.
