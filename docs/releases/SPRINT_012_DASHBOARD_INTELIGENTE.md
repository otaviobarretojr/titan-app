# Sprint 012 — Dashboard Inteligente

## Visão geral

A Sprint 012 redesenha integralmente a Home do PROJETO TITAN, preservando os dados locais e os fluxos existentes. A nova composição é mobile-first e adota princípios do Samsung One UI: título amplo na zona de visualização, ações ao alcance do polegar, superfícies arredondadas e conteúdo prioritário concentrado na metade inferior da tela.

## Entregas

- Score TITAN destacado e acionável, com acesso à análise detalhada.
- Uma única recomendação do Coach: a de maior prioridade calculada pelo engine existente.
- Próxima refeição com estados **no horário**, **atrasada** e **concluída**.
- Treino com ações **iniciar**, **continuar** e estado **concluído**.
- Card de pendências alimentado por refeições vencidas sem registro.
- Resumo diário de proteína, calorias, água e sono com progresso sobre as metas reais.
- Barra inferior persistente e FAB de registro rápido.
- Cards completos como áreas de toque, foco visível e alvos adequados para uso móvel.

## Compatibilidade

Não há migração de banco nem alteração no modelo de persistência. O dashboard continua derivando todas as informações do IndexedDB, o registro rápido de água reutiliza o repositório existente e as rotas funcionais dos módulos foram preservadas.
