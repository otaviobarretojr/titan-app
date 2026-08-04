import type { AnalyticsPoint, Comparison, TrendPeriod } from '../types/analytics'
import { average, percentage } from './analyticsMath'

const hasData = (day: AnalyticsPoint) =>
  day.caloriesKcal > 0 || day.hydrationMl > 0 || day.sleepMinutes !== null ||
  day.workoutCompleted || day.cardioCompleted || day.weightKg !== null || day.waistCm !== null

export function calculateTitanScore(day: AnalyticsPoint) {
  if (!day.calorieTargetKcal || !day.proteinTargetG || !day.hydrationTargetMl || !day.sleepTargetMinutes || !hasData(day)) return null
  const calorieAccuracy = percentage(Math.min(day.caloriesKcal, day.calorieTargetKcal), Math.max(day.caloriesKcal, day.calorieTargetKcal))
  const values = [calorieAccuracy, percentage(day.proteinG, day.proteinTargetG), percentage(day.hydrationMl, day.hydrationTargetMl)]
  if (day.sleepMinutes !== null) values.push(percentage(day.sleepMinutes, day.sleepTargetMinutes))
  values.push(day.workoutCompleted ? 100 : 0, day.cardioCompleted ? 100 : 0)
  return Math.round(average(values) ?? 0)
}

export function calculateStreaks(days: AnalyticsPoint[]) {
  let best = 0, running = 0
  for (const day of days) {
    running = hasData(day) ? running + 1 : 0
    best = Math.max(best, running)
  }
  let current = 0
  for (let index = days.length - 1; index >= 0 && hasData(days[index]); index -= 1) current += 1
  return { current, best }
}

function periodKey(date: string, mode: 'week' | 'month') {
  if (mode === 'month') return date.slice(0, 7)
  const value = new Date(`${date}T12:00:00Z`)
  const weekday = value.getUTCDay() || 7
  value.setUTCDate(value.getUTCDate() - weekday + 1)
  return value.toISOString().slice(0, 10)
}

export function aggregateTrends(days: AnalyticsPoint[], mode: 'week' | 'month'): TrendPeriod[] {
  const groups = new Map<string, AnalyticsPoint[]>()
  days.forEach((day) => groups.set(periodKey(day.localDate, mode), [...(groups.get(periodKey(day.localDate, mode)) ?? []), day]))
  return [...groups.entries()].map(([key, group]) => {
    const scores = group.map((day) => day.titanScore).filter((score): score is number => score !== null)
    const populated = group.filter(hasData).length
    return { label: mode === 'week' ? `Semana ${key.slice(5)}` : new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${key}-01T12:00:00Z`)), startDate: group[0].localDate, endDate: group.at(-1)!.localDate, score: scores.length ? Math.round(average(scores)!) : null, consistency: Math.round(populated / group.length * 100), workouts: group.filter((day) => day.workoutCompleted).length, cardios: group.filter((day) => day.cardioCompleted).length, daysWithData: populated }
  })
}

export function compareScores(days: AnalyticsPoint[], window: number): Comparison {
  const score = (slice: AnalyticsPoint[]) => average(slice.map((day) => day.titanScore).filter((item): item is number => item !== null))
  const current = score(days.slice(-window)); const previous = score(days.slice(-window * 2, -window))
  return { current: current === null ? null : Math.round(current), previous: previous === null ? null : Math.round(previous), changePercentage: current === null || previous === null || previous === 0 ? null : Math.round((current - previous) / previous * 100) }
}

export function metricEvolution(days: AnalyticsPoint[], selector: (day: AnalyticsPoint) => number | null) {
  const values = days.map(selector).filter((value): value is number => value !== null)
  return values.length > 1 ? Number((values.at(-1)! - values[0]).toFixed(1)) : null
}

export function coverage(days: AnalyticsPoint[]) {
  const metrics = { nutrição: (d: AnalyticsPoint) => d.caloriesKcal > 0, água: (d: AnalyticsPoint) => d.hydrationMl > 0, sono: (d: AnalyticsPoint) => d.sleepMinutes !== null, treino: (d: AnalyticsPoint) => d.workoutCompleted, cardio: (d: AnalyticsPoint) => d.cardioCompleted, corpo: (d: AnalyticsPoint) => d.weightKg !== null || d.waistCm !== null }
  const byMetric = Object.fromEntries(Object.entries(metrics).map(([key, check]) => [key, Math.round(days.filter(check).length / days.length * 100)]))
  const daysWithData = days.filter(hasData).length
  return { percentage: Math.round(daysWithData / days.length * 100), daysWithData, totalDays: days.length, byMetric }
}
