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
- O Workbox usa precache, `NetworkFirst` para navegação e `CacheFirst` limitado para imagens, respeitando a base `/titan-app/` do GitHub Pages.
