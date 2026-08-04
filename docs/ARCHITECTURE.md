# TITAN — Arquitetura

- `app`: inicialização, rotas e providers.
- `shared`: componentes reutilizáveis.
- `modules`: funcionalidades por domínio.
- `database`: persistência local.
- `services`: serviços transversais.
- `styles`: tokens e estilos globais.

## Camada de experiência

- `shared/ui` concentra as primitivas visuais e os estados reutilizáveis (`EmptyState`, `LoadingCard`, `StatCard`, `SectionHeader`, `InfoBanner` e `ConfirmDialog`).
- O dashboard compõe cards independentes por uma lista de ordem declarativa, permitindo reorganização futura sem misturar regras de domínio à tela.
- Rotas continuam carregadas sob demanda e usam transições CSS progressivas; `prefers-reduced-motion` desativa movimento não essencial.
- Estados do dashboard são derivados exclusivamente das consultas reativas ao IndexedDB. Nenhuma API externa ou estado remoto foi introduzido.

Regra principal: componentes de tela não concentram regras de negócio.

## Plataforma local

- `services/pwa`: detecção segura de instalação e diferenças do iOS.
- `services/notifications`: permissão sob ação do usuário e preferências persistidas.
- `services/backup`: envelope JSON v2, validação anterior à escrita e transação única do IndexedDB.
- `services/storage`: estimativas da Storage API e contagens do IndexedDB.
- `modules/evolution`: regras puras de médias por janela, comparações, validação, métricas de força/cardio e processamento local de fotos. A UI não fabrica amostras ausentes.
- O schema Dexie 10 adiciona `bioimpedance` e campos opcionais a medições/fotos. A evolução usa leitura adaptativa dos schemas anteriores e recordes de força derivados das séries existentes.
- O Workbox usa precache, `NetworkFirst` para navegação e `CacheFirst` limitado para imagens, respeitando a base `/titan-app/` do GitHub Pages.

## Coach TITAN Intelligence

- `modules/coach/engine` contém regras puras e determinísticas de insights, alertas, priorização, tendências e timeline.
- `coachRepository` é a fronteira de dados: agrega exclusivamente tabelas locais do Dexie, persiste recomendações e aplica cooldown antirrepetição.
- Janelas de 7, 30 e 90 dias ignoram ausências e exigem duas ou mais amostras; explicações carregam evidência, período e tamanho da amostra.
