import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyThemeMode, normalizeThemeMode } from '../src/services/preferences/appPreferences'
import { parseTitanFileText, previewTitanImport, TitanFileError } from '../src/services/import/titanImportService'

describe('Release v1.0.3 importação e tema', () => {
  beforeEach(() => {
    const dataset: Record<string, string> = {}
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: false }) })
    vi.stubGlobal('document', { documentElement: { dataset, removeAttribute: (name: string) => { delete dataset[name.replace('data-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] } } })
  })

  it('captura JSON inválido com mensagem amigável', async () => {
    await expect(parseTitanFileText('{', 'project')).rejects.toMatchObject({ title: 'Arquivo incompatível', message: 'O arquivo não contém um JSON TITAN válido.' })
  })

  it('rejeita importador de módulo incompatível', async () => {
    const text = JSON.stringify({ titan: true, kind: 'workout', title: 'Treino', author: 'TITAN', createdAt: '2026-08-05T00:00:00.000Z', data: { workoutPlans: [], exercisePlans: [] } })
    await expect(parseTitanFileText(text, 'nutrition')).rejects.toBeInstanceOf(TitanFileError)
  })

  it('gera prévia com módulos atualizados, preservados e histórico preservado', async () => {
    const file = await parseTitanFileText(JSON.stringify({ titan: true, kind: 'nutrition', title: 'Plano alimentar', author: 'Coach', createdAt: '2026-08-05T00:00:00.000Z', data: { dailyPlans: [], mealPlans: [] } }), 'nutrition')
    const preview = previewTitanImport(file)
    expect(preview).toMatchObject({ title: 'Plano alimentar', modules: ['dailyPlans', 'mealPlans'], updated: ['dailyPlans', 'mealPlans'] })
    expect(preview.preserved).toContain('workout')
    expect(preview.preserved).toContain('importHistory')
  })

  it('normaliza premium/amoled para dark sem mapear Sistema para premium', () => {
    expect(normalizeThemeMode('premium')).toBe('dark')
    expect(normalizeThemeMode('amoled')).toBe('dark')
    expect(normalizeThemeMode('system')).toBe('system')
  })

  it('aplica system/light/dark no documentElement', () => {
    const darkMatcher = vi.fn().mockReturnValue({ matches: true })
    expect(applyThemeMode('system', darkMatcher)).toBe('dark')
    expect(document.documentElement.dataset.themeMode).toBe('system')
    expect(applyThemeMode('light')).toBe('light')
    expect(applyThemeMode('dark')).toBe('dark')
  })
})
