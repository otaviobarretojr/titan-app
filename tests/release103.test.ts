import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { previewTitanImport } from '../src/services/titanFile/titanFileService'

const baseEnvelope = (expectedType: string, payload: unknown) => ({ format: 'titan-file', version: '1.0.3', exportedAt: '2026-08-05T12:00:00.000Z', timezone: 'America/Manaus', expectedType, payload })
const nutrition = { expectedType: 'nutrition', id: 'nutrition-1', localDate: '2026-08-05', calorieTargetKcal: 2500, proteinTargetG: 180, hydrationTargetMl: 4000, sleepTargetMinutes: 480 }
const workout = { expectedType: 'workout', id: 'workout-1', localDate: '2026-08-05', name: 'Upper', plannedTime: '16:00', exerciseCount: 5, estimatedDurationMinutes: 70 }
const supplements = { expectedType: 'supplements', id: 'supp-1', localDate: '2026-08-05', name: 'Creatina', plannedTime: '08:00', dose: '5 g' }


describe('Release v1.0.3 estável', () => {
  it('valida expectedType, horários, negativos e duplicados', () => {
    expect(() => previewTitanImport(baseEnvelope('workout', { ...workout, expectedType: 'cardio' }))).toThrow()
    expect(() => previewTitanImport(baseEnvelope('workout', { ...workout, plannedTime: '25:00' }))).toThrow()
    expect(() => previewTitanImport(baseEnvelope('nutrition', { ...nutrition, calorieTargetKcal: -1 }))).toThrow()
    expect(() => previewTitanImport(baseEnvelope('project', { expectedType: 'project', workout: [workout, workout] }))).toThrow(/duplicados/)
  })

  it('distribui project sem inserir project em activePlans e inclui suplementos na prévia', () => {
    const envelope = baseEnvelope('project', { expectedType: 'project', profile: { expectedType: 'profile', displayName: 'Otávio', timezone: 'America/Manaus' }, workout: [workout], nutrition: [nutrition], cardio: [], supplements: [supplements] })
    const preview = previewTitanImport(envelope)
    expect(preview.activePlanTypes).toEqual(['workout', 'nutrition', 'supplements'])
    expect(preview.activePlanTypes).not.toContain('project')
    expect(preview.counts.supplements).toBe(1)
  })

  it('declara arquitetura com rollback transacional, leitura/escrita separadas e deduplicação', () => {
    const service = readFileSync('src/services/titanFile/titanFileService.ts', 'utf8')
    const coachRepository = readFileSync('src/modules/coach/data/coachRepository.ts', 'utf8')
    const dashboard = readFileSync('src/modules/dashboard/pages/DashboardPage.tsx', 'utf8')
    const hook = readFileSync('src/modules/coach/hooks/usePersistCoachInsights.ts', 'utf8')
    expect(service).toContain("transaction('rw'")
    expect(service).toContain('importHistory.add(history)')
    expect(coachRepository.match(/export async function getCoachReport[\s\S]*?return/g)?.[0]).not.toMatch(/bulkAdd|put|add|update|delete/)
    expect(coachRepository).toContain('export async function persistCoachInsights')
    expect(coachRepository).toContain('row.localDate === today && row.insightKey === insight.id')
    expect(hook).toContain('useEffect')
    expect(hook).toContain('.catch')
    expect(dashboard).toContain('usePersistCoachInsights')
  })

  it('cobre onboarding, tema e dashboard sem depender da persistência acessória', () => {
    const main = readFileSync('src/main.tsx', 'utf8')
    const settings = readFileSync('src/modules/settings/pages/SettingsPage.tsx', 'utf8')
    expect(main).toContain('titan-theme')
    expect(settings).toContain('titan-theme')
    expect(settings).toContain('Restaurar backup')
  })
})
