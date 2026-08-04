export type AnalyticsPoint = {
  localDate: string
  caloriesKcal: number
  proteinG: number
  hydrationMl: number
  sleepMinutes: number | null
  workoutCompleted: boolean
  cardioCompleted: boolean
  weightKg: number | null
  waistCm: number | null
  strengthKg: number | null
  calorieTargetKcal: number | null
  proteinTargetG: number | null
  hydrationTargetMl: number | null
  sleepTargetMinutes: number | null
  titanScore: number | null
}

export type TrendPeriod = {
  label: string
  startDate: string
  endDate: string
  score: number | null
  consistency: number
  workouts: number
  cardios: number
  daysWithData: number
}

export type Comparison = {
  current: number | null
  previous: number | null
  changePercentage: number | null
}

export type AnalyticsSummary = {
  days: AnalyticsPoint[]
  weeklyTrends: TrendPeriod[]
  monthlyTrends: TrendPeriod[]
  averages: { caloriesKcal: number; proteinG: number; hydrationMl: number; sleepMinutes: number | null; weightKg: number | null }
  totals: { workouts: number; cardios: number; cardioMinutes: number; cardioDistanceKm: number }
  adherence: { nutrition: number; hydration: number; sleep: number; training: number }
  evolution: { weightKg: number | null; waistCm: number | null; titanScore: number | null }
  streaks: { current: number; best: number }
  consistency: number
  coverage: { percentage: number; daysWithData: number; totalDays: number; byMetric: Record<string, number> }
  comparisons: { weekly: Comparison; monthly: Comparison }
  personalRecords: Array<{ exerciseName: string; estimatedOneRepMaxKg: number; localDate: string }>
  coachTimeline: Array<{ id: string; localDate: string; title: string; message: string; priority: 'low' | 'medium' | 'high'; occurredAt: string }>
}
