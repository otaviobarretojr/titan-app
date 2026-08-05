# TITAN — Instalação

**Versão:** 1.0.0  
**Data:** 5 de agosto de 2026  
**Ambiente de produção:** GitHub Pages em `https://otaviobarretojr.github.io/titan-app/`  
**Compatibilidade:** navegador moderno com IndexedDB, Service Worker e Web App Manifest.  
**Licença:** Proprietary.  
**Autor:** Otávio Barreto Jr.

## Usuário final

### Android/Chrome ou Edge

1. Abra a URL oficial.
2. Toque em **Instalar TITAN** quando o botão aparecer ou use o menu do navegador → instalar app.
3. Abra pelo ícone instalado e aguarde o cache inicial.
4. Faça um backup JSON periodicamente.

### iPhone/iPad

1. Abra a URL no Safari.
2. Toque em Compartilhar.
3. Escolha **Adicionar à Tela de Início**.
4. Abra pelo ícone criado.

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run validate
```

## PWA/offline

O Service Worker é gerado no build de produção. A navegação usa estratégia `NetworkFirst`, imagens usam `CacheFirst` com expiração e o manifesto referencia ícones SVG `any` e `maskable`. Para validar offline, gere o build, publique/preview em ambiente HTTPS ou localhost e teste recarga após ativação do Service Worker.

## Variáveis opcionais

Backup em nuvem requer:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_VERSION=1.0.0
```

Sem essas variáveis, o TITAN continua funcionando localmente e o backup JSON local permanece disponível.
