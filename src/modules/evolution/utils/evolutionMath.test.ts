import { describe, expect, it } from 'vitest'
import { averageInWindow, calculateAverage, calculateCardioMetrics, comparePeriods, weightTrend } from './evolutionMath'
describe('evolution math', () => {
  it('does not turn days without measurements into zero', () => expect(averageInWindow([{localDate:'2026-08-01',value:80},{localDate:'2026-08-04',value:82}], '2026-08-04', 7)).toBe(81))
  it('returns null without data', () => expect(calculateAverage([])).toBeNull())
  it('compares calendar periods', () => expect(comparePeriods([{localDate:'2026-08-04',value:81},{localDate:'2026-07-28',value:80}], '2026-08-04', 7).variation).toBe(1))
  it('classifies gain, loss, stability and insufficient samples', () => { expect(weightTrend([{localDate:'2026-01-01',value:80}])).toBe('insufficient'); expect(weightTrend([{localDate:'2026-01-01',value:80},{localDate:'2026-01-02',value:80.1}])).toBe('stable'); expect(weightTrend([{localDate:'2026-01-01',value:80},{localDate:'2026-01-02',value:81}])).toBe('gain') })
  it('calculates cardio totals and distance-weighted pace', () => expect(calculateCardioMetrics([{localDate:'2026-08-04',durationMinutes:30,distanceKm:5},{localDate:'2026-08-03',durationMinutes:20,distanceKm:null}], '2026-08-04')).toMatchObject({sessions:2,totalMinutes:50,totalDistanceKm:5,averagePace:6,bestPace:6,longestDistanceKm:5}))
})
