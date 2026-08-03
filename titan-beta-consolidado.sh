#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Consolidação Beta"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/$STAMP"

mkdir -p "$BACKUP_DIR" .github/workflows docs/releases scripts

echo "🛡️ Criando backup local..."
for item in src docs package.json package-lock.json vite.config.ts README.md; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

echo "🧭 Ajustando roteamento para GitHub Pages..."
python3 - <<'PY'
from pathlib import Path

candidates = [Path("src/main.tsx"), Path("src/app/App.tsx")]
for path in candidates:
    if not path.exists():
        continue
    content = path.read_text()
    content = content.replace("BrowserRouter", "HashRouter")
    content = content.replace(
        "import { HashRouter } from 'react-router-dom'",
        "import { HashRouter } from 'react-router-dom'",
    )
    content = content.replace(
        "import { BrowserRouter } from 'react-router-dom'",
        "import { HashRouter } from 'react-router-dom'",
    )
    content = content.replace("<BrowserRouter>", "<HashRouter>")
    content = content.replace("</BrowserRouter>", "</HashRouter>")
    path.write_text(content)
PY

echo "⚙️ Configurando Vite e PWA..."
cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/titan-app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/titan.svg', 'icons/titan-maskable.svg'],
      manifest: {
        name: 'TITAN',
        short_name: 'TITAN',
        description:
          'Sistema operacional de performance pessoal para treino, nutrição, cardio e evolução.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/titan.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/titan-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,webp,json}'],
      },
    }),
  ],
})
EOF

mkdir -p public/icons

cat > public/icons/titan.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#09090b"/>
  <rect x="72" y="72" width="368" height="368" rx="96" fill="#2563eb"/>
  <path d="M138 150h236v54h-88v166h-60V204h-88z" fill="#fff"/>
</svg>
EOF

cat > public/icons/titan-maskable.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#09090b"/>
  <circle cx="256" cy="256" r="190" fill="#2563eb"/>
  <path d="M138 150h236v54h-88v166h-60V204h-88z" fill="#fff"/>
</svg>
EOF

echo "🧪 Criando validação de release..."
cat > scripts/validate-release.mjs <<'EOF'
import { access, readFile } from 'node:fs/promises'

const requiredFiles = [
  'dist/index.html',
  'dist/manifest.webmanifest',
  'dist/sw.js',
]

for (const file of requiredFiles) {
  await access(file)
}

const indexHtml = await readFile('dist/index.html', 'utf8')

if (!indexHtml.includes('/titan-app/')) {
  throw new Error('Build sem base correta para GitHub Pages.')
}

console.log('✅ Release validada.')
EOF

node <<'EOF'
const fs = require('node:fs')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

packageJson.version = '0.9.0-beta.2'
packageJson.scripts = {
  ...packageJson.scripts,
  typecheck: 'tsc --noEmit',
  validate: 'npm run lint && npm run typecheck && npm run build && npm run validate:release',
  'validate:release': 'node scripts/validate-release.mjs',
}

fs.writeFileSync(
  'package.json',
  `${JSON.stringify(packageJson, null, 2)}\n`,
)
EOF

echo "🚢 Criando workflow de publicação..."
cat > .github/workflows/deploy-pages.yml <<'EOF'
name: Deploy TITAN

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - name: Install
        run: npm ci

      - name: Validate
        run: npm run validate

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
EOF

cat > docs/releases/v0.9.0-beta.2.md <<'EOF'
# TITAN v0.9.0-beta.2

## Objetivo

Consolidar a Beta atual e torná-la publicável e instalável.

## Incluído

- Rotas compatíveis com GitHub Pages.
- PWA e Service Worker.
- Build de produção validado.
- Workflow automático de publicação.
- Backup local de segurança antes da aplicação.
- Validação de lint, TypeScript, build e arquivos PWA.

## URL esperada

`https://otaviobarretojr.github.io/titan-app/`
EOF

cat > README.md <<'EOF'
# TITAN

Sistema operacional de performance pessoal, mobile-first e instalável como PWA.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação completa

```bash
npm run validate
```

## Publicação

Todo push para `main` executa validação e publicação automática no GitHub Pages.

URL esperada:

```text
https://otaviobarretojr.github.io/titan-app/
```

## Dados

Os registros permanecem no IndexedDB do navegador. Exporte backup antes de limpar dados ou trocar de aparelho.
EOF

echo "📦 Atualizando dependências..."
npm install

echo "✅ Executando validação completa..."
npm run validate

echo
echo "🎉 Consolidação concluída."
echo "Backup local: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "release: consolidate TITAN beta 0.9.0-beta.2"'
echo 'git push'
