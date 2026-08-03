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
