export type DatedValue = { localDate: string; value: number }

const dayMs = 86_400_000
const timestamp = (date: string) => Date.parse(`${date}T00:00:00Z`)

export function calculateVariation(latest: number | null, previous: number | null) {
  if (latest === null || previous === null) return null
  return latest - previous
}

export function calculateAverage(values: number[]) {
  const valid = values.filter(Number.isFinite)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

/** A calendar window; missing days are absent, never converted to zero. */
export function averageInWindow(points: DatedValue[], endDate: string, days: number) {
  const end = timestamp(endDate)
  return calculateAverage(points.filter(({ localDate }) => {
    const age = (end - timestamp(localDate)) / dayMs
    return age >= 0 && age < days
  }).map(({ value }) => value))
}

export function comparePeriods(points: DatedValue[], endDate: string, days: number) {
  const end = timestamp(endDate)
  const current = points.filter(({ localDate }) => {
    const age = (end - timestamp(localDate)) / dayMs
    return age >= 0 && age < days
  }).map(({ value }) => value)
  const previous = points.filter(({ localDate }) => {
    const age = (end - timestamp(localDate)) / dayMs
    return age >= days && age < days * 2
  }).map(({ value }) => value)
  const currentAverage = calculateAverage(current)
  const previousAverage = calculateAverage(previous)
  return {
    currentAverage,
    previousAverage,
    variation: calculateVariation(currentAverage, previousAverage),
    currentSamples: current.length,
    previousSamples: previous.length,
  }
}

export function weightTrend(points: DatedValue[]): 'gain' | 'loss' | 'stable' | 'insufficient' {
  if (points.length < 2) return 'insufficient'
  const sorted = [...points].sort((a, b) => a.localDate.localeCompare(b.localDate))
  const delta = sorted.at(-1)!.value - sorted[0].value
  if (Math.abs(delta) < 0.3) return 'stable'
  return delta > 0 ? 'gain' : 'loss'
}

export function normalizeChartValue(value: number, minimum: number, maximum: number) {
  if (maximum <= minimum) return 50
  return ((value - minimum) / (maximum - minimum)) * 100
}

export function calculateCardioMetrics(sessions: Array<{ localDate: string; durationMinutes: number; distanceKm: number | null }>, endDate: string, days = 7) {
  const end = timestamp(endDate)
  const valid = sessions.filter((item) => {
    const age = (end - timestamp(item.localDate)) / dayMs
    return age >= 0 && age < days && Number.isFinite(item.durationMinutes) && item.durationMinutes > 0
  })
  const distanceSessions = valid.filter((item) => item.distanceKm !== null && Number.isFinite(item.distanceKm) && item.distanceKm! > 0)
  const totalMinutes = valid.reduce((sum, item) => sum + item.durationMinutes, 0)
  const totalDistanceKm = distanceSessions.reduce((sum, item) => sum + item.distanceKm!, 0)
  const paces = distanceSessions.map((item) => item.durationMinutes / item.distanceKm!)
  return {
    sessions: valid.length,
    totalMinutes,
    totalDistanceKm,
    averagePace: totalDistanceKm > 0 ? distanceSessions.reduce((sum, item) => sum + item.durationMinutes, 0) / totalDistanceKm : null,
    bestPace: paces.length ? Math.min(...paces) : null,
    longestDistanceKm: distanceSessions.length ? Math.max(...distanceSessions.map((item) => item.distanceKm!)) : null,
  }
}
