import { access, readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

const requiredFiles = [
  'dist/index.html',
  'dist/manifest.webmanifest',
  'dist/sw.js',
  'docs/releases/SPRINT_007_ANALYTICS.md',
  'docs/releases/SPRINT_008_PWA_CONFIABILIDADE.md',
  'docs/releases/SPRINT_009_EVOLUCAO_AVANCADA.md',
  'docs/releases/SPRINT_010_TITAN_EXPERIENCE.md',
  'docs/releases/SPRINT_013_ANALYTICS_RELATORIOS.md',
  'docs/releases/V1_0_0.md',
  'docs/USER_GUIDE.md',
  'docs/INSTALLATION.md',
  'docs/PROJECT_HISTORY.md',
  'docs/V1_CHECKLIST.md',
]

for (const file of requiredFiles) {
  await access(file)
}

const indexHtml = await readFile('dist/index.html', 'utf8')
const manifest = JSON.parse(
  await readFile('dist/manifest.webmanifest', 'utf8'),
)

if (!indexHtml.includes('/titan-app/')) {
  throw new Error('Build sem base correta para GitHub Pages.')
}

if (manifest.name !== 'TITAN') {
  throw new Error('Manifesto PWA sem nome oficial TITAN.')
}

if (!manifest.description?.includes('v1.0.3')) {
  throw new Error('Manifesto PWA sem descrição versionada da release v1.0.3.')
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  throw new Error('Manifesto PWA sem ícones.')
}

for (const icon of manifest.icons) {
  const pathname = new URL(icon.src, 'https://titan.local/titan-app/').pathname
  const relativePath = pathname.replace(/^\/titan-app\//, '')
  const iconPath = resolve('dist', relativePath)
  const distRoot = `${resolve('dist')}${sep}`

  if (!iconPath.startsWith(distRoot)) {
    throw new Error(`Caminho de ícone inválido no manifesto: ${icon.src}`)
  }

  try {
    await access(iconPath)
  } catch {
    throw new Error(`Ícone inexistente referenciado no manifesto: ${icon.src}`)
  }
}

const analyticsSource = await readFile(
  'src/modules/analytics/data/analyticsRepository.ts',
  'utf8',
)

if (analyticsSource.includes('fetch(') || analyticsSource.includes('axios')) {
  throw new Error('Analytics deve operar exclusivamente com o IndexedDB.')
}

console.log('✅ Release validada.')
