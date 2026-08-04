# Sprint 016 — Experiência Premium (UX/UI)

## Visão geral

A Sprint 016 eleva a percepção profissional do TITAN sem alterar regras de negócio, APIs públicas ou schema IndexedDB. O foco foi refinamento visual, microinterações, skeleton loading, navegação, dark premium, responsividade, PWA percebido, performance e acessibilidade.

## Entregas

- Home com camadas visuais mais premium, cards com profundidade, contraste reforçado, hierarquia de título, Score TITAN em destaque, próximos eventos e indicadores com menor instabilidade visual.
- Design system expandido com tokens CSS reutilizáveis para cores, superfícies, bordas, radius, espaçamentos, elevação e estados sem introduzir dependências novas.
- Microinterações discretas para ripple, FAB, navegação, hidratação concluída, superfícies interativas, transições entre rotas e respeito a `prefers-reduced-motion`.
- Skeleton loading reutilizável aplicado ao Dashboard, Coach, Analytics, Evolução, Notificações e Conta para reduzir piscadas de layout.
- Bottom Navigation com indicador explícito da página atual, foco visível e superfícies adaptadas a mobile Android, tablets e desktop.
- Tema escuro refinado com superfícies não absolutas, separação entre cards, gradientes sutis e contraste melhorado.
- Performance preservada com rotas carregadas sob demanda, componente de skeleton reutilizável, navegação memoizada e animações CSS leves.
- Acessibilidade reforçada com `aria-live`, `role=status`, labels existentes preservados, foco visível e suporte a redução de movimento.

## Compatibilidade

Nenhuma migração de banco foi adicionada. O IndexedDB continua sendo a fonte local principal e os fluxos existentes de treino, nutrição, hidratação, notificações, analytics, evolução e backup foram preservados.

## Limitações conhecidas

- As animações são intencionalmente discretas e dependem de suporte CSS do navegador.
- Notificações de sistema continuam sujeitas às limitações do navegador e da PWA, conforme Sprint 014.
- Backup em nuvem permanece manual e opcional, conforme Sprint 015.
