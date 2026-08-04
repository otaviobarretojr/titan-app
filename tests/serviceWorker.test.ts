import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Service Worker', () => {
  it('mantém atualização, limpeza e caches de runtime configurados', async () => {
    const config = await readFile('vite.config.ts', 'utf8')
    expect(config).toContain("registerType: 'prompt'")
    expect(config).toContain('cleanupOutdatedCaches: true')
    expect(config).toContain("handler: 'NetworkFirst'")
    expect(config).toContain("handler: 'CacheFirst'")
  })
})
