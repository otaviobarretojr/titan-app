import { describe, expect, it } from 'vitest'
import { createAnalyticsPdf } from './exportAnalytics'
import type { AnalyticsSummary } from '../types/analytics'

describe('createAnalyticsPdf', () => {
  it('gera um documento PDF local válido', () => {
    const summary: AnalyticsSummary = {
      days: [],
      weeklyTrends: [],
      monthlyTrends: [],
      averages: {
        caloriesKcal: 0,
        proteinG: 0,
        hydrationMl: 0,
        sleepMinutes: null,
        weightKg: null,
      },
      totals: {
        workouts: 0,
        cardios: 0,
        cardioMinutes: 0,
        cardioDistanceKm: 0,
      },
      adherence: {
        nutrition: 0,
        hydration: 0,
        sleep: 0,
        training: 0,
      },
      evolution: {
        weightKg: null,
        waistCm: null,
        titanScore: null,
      },
      streaks: {
        current: 0,
        best: 0,
      },
      consistency: 0,
      coverage: {
        percentage: 0,
        daysWithData: 0,
        totalDays: 0,
        byMetric: {},
      },
      comparisons: {
        weekly: {
          current: null,
          previous: null,
          changePercentage: null,
        },
        monthly: {
          current: null,
          previous: null,
          changePercentage: null,
        },
      },
      personalRecords: [],
      coachTimeline: [],
    }

    const pdf = new TextDecoder().decode(
      createAnalyticsPdf(summary, 'weekly'),
    )

    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.endsWith('%%EOF')).toBe(true)
    expect(pdf).toContain('Relatorio semanal')
  })
})
