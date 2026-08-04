import { describe, expect, it } from 'vitest'
import type { AnalyticsPoint } from '../types/analytics'
import { aggregateTrends, calculateStreaks, calculateTitanScore, compareScores, coverage } from './analyticsEngine'

const day = (localDate: string, data = true): AnalyticsPoint => ({ localDate, caloriesKcal: data ? 2000 : 0, proteinG: data ? 150 : 0, hydrationMl: data ? 3000 : 0, sleepMinutes: data ? 480 : null, workoutCompleted: data, cardioCompleted: false, weightKg: data ? 90 : null, waistCm: null, strengthKg: null, calorieTargetKcal: 2000, proteinTargetG: 150, hydrationTargetMl: 3000, sleepTargetMinutes: 480, titanScore: data ? 83 : null })

describe('analytics engine', () => {
  it('calcula score somente quando existem plano e dados', () => { expect(calculateTitanScore(day('2026-08-01'))).toBe(83); expect(calculateTitanScore(day('2026-08-02', false))).toBeNull() })
  it('calcula streak atual e recorde', () => { expect(calculateStreaks([day('2026-08-01'), day('2026-08-02', false), day('2026-08-03'), day('2026-08-04')])).toEqual({ current: 2, best: 2 }) })
  it('agrupa tendências e compara janelas', () => { const days = Array.from({ length: 14 }, (_, i) => day(`2026-07-${String(i + 1).padStart(2, '0')}`)); expect(aggregateTrends(days, 'week').length).toBeGreaterThan(1); expect(compareScores(days, 7).changePercentage).toBe(0) })
  it('mede cobertura real sem inventar registros', () => { expect(coverage([day('2026-08-01'), day('2026-08-02', false)])).toMatchObject({ percentage: 50, daysWithData: 1, totalDays: 2 }) })
})
