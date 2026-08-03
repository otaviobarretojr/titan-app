#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Beta Release Package"

mkdir -p .github/workflows docs/releases scripts

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
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
      },
    }),
  ],
})
EOF

cat > .github/workflows/deploy-pages.yml <<'EOF'
name: Deploy TITAN to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
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

      - name: Install dependencies
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
  throw new Error('Build não contém a base correta do GitHub Pages.')
}

console.log('Release validada com sucesso.')
EOF

node <<'EOF'
const fs = require('node:fs')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

packageJson.version = '0.9.0-beta.1'
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

cat > docs/releases/v0.9.0-beta.1.md <<'EOF'
# TITAN v0.9.0-beta.1

## Incluído

- Dashboard integrado.
- Nutrição e refeições.
- Treino e séries.
- Cardio.
- Evolução corporal.
- Sono.
- Coach e Score TITAN.
- Relatórios semanais.
- Backup e restauração.
- PWA e funcionamento offline.
- Publicação automática no GitHub Pages.

## Limitações conhecidas

- Notificações persistentes dependem das limitações do navegador.
- A Beta utiliza armazenamento local do aparelho.
- Fotos, exames avançados e biblioteca completa de exercícios ficam para versões posteriores.
EOF

cat > README.md <<'EOF'
# TITAN

PWA mobile-first para treino, nutrição, cardio, evolução, recuperação e decisões diárias de performance.

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

O push para `main` executa validação e publicação automática no GitHub Pages.

## Dados

Os dados ficam no IndexedDB do navegador. Use a função de backup antes de limpar dados do navegador ou trocar de aparelho.
EOF

echo "🧪 Executando validação completa..."
npm run validate

echo
echo "✅ Pacote Beta aplicado."
echo 'Próximo comando: git add . && git commit -m "release: publish TITAN v0.9.0-beta.1" && git push'
