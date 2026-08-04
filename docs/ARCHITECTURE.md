# TITAN — Arquitetura

- `app`: inicialização, rotas e providers.
- `shared`: componentes reutilizáveis.
- `modules`: funcionalidades por domínio.
- `database`: persistência local.
- `services`: serviços transversais.
- `styles`: tokens e estilos globais.

Regra principal: componentes de tela não concentram regras de negócio.

## Plataforma local

- `services/pwa`: detecção segura de instalação e diferenças do iOS.
- `services/notifications`: permissão sob ação do usuário e preferências persistidas.
- `services/backup`: envelope JSON v2, validação anterior à escrita e transação única do IndexedDB.
- `services/storage`: estimativas da Storage API e contagens do IndexedDB.
- `modules/evolution`: regras puras de médias por janela, comparações, validação, métricas de força/cardio e processamento local de fotos. A UI não fabrica amostras ausentes.
- O schema Dexie 10 adiciona `bioimpedance` e campos opcionais a medições/fotos. A evolução usa leitura adaptativa dos schemas anteriores e recordes de força derivados das séries existentes.
- O Workbox usa precache, `NetworkFirst` para navegação e `CacheFirst` limitado para imagens, respeitando a base `/titan-app/` do GitHub Pages.
