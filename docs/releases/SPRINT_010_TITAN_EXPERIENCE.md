# Sprint 010 — TITAN Experience

## Motivation

Elevar a rotina diária do TITAN a uma experiência premium, previsível e acessível sem sacrificar recursos existentes, funcionamento offline ou compatibilidade com o IndexedDB.

## Description

- Dashboard mobile-first dividido em cards independentes para Score TITAN, próxima refeição, refeições pendentes, treino, cardio, Coach TITAN, evolução de peso, hidratação e sono.
- Ordem dos blocos declarada em uma lista estável, pronta para uma preferência local de reorganização em sprint futura.
- Score com pontuação, estado, tendência do dia e referência de progresso semanal; o produto não inventa histórico quando ainda não há amostras.
- Coach premium com prioridade, resumo contextual e acesso a detalhes, mantendo a engine local preparada para evoluções futuras.
- Design system ampliado com `EmptyState`, `LoadingCard`, `StatCard`, `SectionHeader`, `InfoBanner` e `ConfirmDialog`.
- Skeleton loading, estados vazio/erro/sucesso, transições de entrada, alvos de toque e foco visível.
- Navegação continua usando lazy loading; consultas reativas continuam no Dexie/IndexedDB.

## Testing

Execute `npm run validate` para lint, tipos, testes, build, validação de release e verificação de binários.

## Release Notes

Esta entrega não adiciona APIs externas, migrações destrutivas ou dependências de rede em runtime. A experiência instalada continua offline-first e preserva registros existentes.

## Known Limitations

- A ordem está preparada no código, mas personalização por arrastar e soltar ainda não está exposta ao usuário.
- A tendência histórica do Score depende de séries suficientes; sem histórico, a interface informa a referência do dia em vez de fabricar comparação.
