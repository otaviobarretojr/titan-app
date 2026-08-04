import { describe, expect, it } from 'vitest'
import { createAnalyticsPdf } from './exportAnalytics'
import type { AnalyticsSummary } from '../types/analytics'

describe('createAnalyticsPdf', () => {
  it('gera um documento PDF local válido', () => {
    const summary = { days: [], consistency: 0, coverage: { percentage: 0 }, averages: { proteinG: 0, hydrationMl: 0, caloriesKcal: 0, sleepMinutes: null }, totals: { workouts: 0, cardios: 0 } } as AnalyticsSummary
    const pdf = new TextDecoder().decode(createAnalyticsPdf(summary, 'weekly'))
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.endsWith('%%EOF')).toBe(true)
    expect(pdf).toContain('Relatorio semanal')
  })
})
