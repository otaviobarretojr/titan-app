import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { APP_VERSION } from '../src/services/appMetadata'
import { titanDatabase } from '../src/database/titanDatabase'

describe('release v1.0.2', () => {
  it('expõe metadados e preserva o schema Dexie existente', () => {
    expect(APP_VERSION).toBe('1.0.2')
    expect(titanDatabase.verno).toBe(11)
  })

  it('mantém nome do PWA sem versão', async () => {
    const config = await readFile('vite.config.ts', 'utf8')
    expect(config).toContain("name: 'TITAN'")
    expect(config).toContain("short_name: 'TITAN'")
    expect(config).not.toContain("name: 'TITAN v")
  })

  it('documenta tela Sobre com versão correta', async () => {
    const page = await readFile('src/modules/settings/pages/SettingsPage.tsx', 'utf8')
    expect(page).toContain('Sobre o TITAN')
    expect(page).toContain('APP_VERSION')
    expect(page).toContain('getDatabaseVersion')
  })
})
