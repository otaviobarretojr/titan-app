import { execFileSync } from 'node:child_process'

const base = process.env.BINARY_DIFF_BASE ?? 'HEAD^'
const binaryExtensions = new Set([
  '.avif', '.bmp', '.gif', '.ico', '.jpeg', '.jpg', '.pdf', '.png', '.webp',
  '.woff', '.woff2', '.ttf', '.zip',
])

const output = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`],
  { encoding: 'utf8' },
)

const binaryAssets = output
  .split('\n')
  .filter(Boolean)
  .filter((file) => {
    const extension = file.slice(file.lastIndexOf('.')).toLowerCase()
    return binaryExtensions.has(extension)
  })

if (binaryAssets.length > 0) {
  throw new Error(
    `O diff contém assets binários novos ou modificados:\n${binaryAssets.join('\n')}`,
  )
}

console.log(`✅ Diff sem novos assets binários (base: ${base}).`)
