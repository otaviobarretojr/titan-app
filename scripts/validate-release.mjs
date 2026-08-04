import { access, readFile } from 'node:fs/promises'

const requiredFiles = [
  'dist/index.html',
  'dist/manifest.webmanifest',
  'dist/sw.js',
  'docs/releases/SPRINT_007_ANALYTICS.md',
]

for (const file of requiredFiles) {
  await access(file)
}

const indexHtml = await readFile('dist/index.html', 'utf8')

if (!indexHtml.includes('/titan-app/')) {
  throw new Error('Build sem base correta para GitHub Pages.')
}

const analyticsSource = await readFile(
  'src/modules/analytics/data/analyticsRepository.ts',
  'utf8',
)

if (analyticsSource.includes('fetch(') || analyticsSource.includes('axios')) {
  throw new Error('Analytics deve operar exclusivamente com o IndexedDB.')
}

console.log('✅ Release validada.')
