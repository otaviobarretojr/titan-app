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
}

export type AnalyticsSummary = {
  days: AnalyticsPoint[]
  averages: {
    caloriesKcal: number
    proteinG: number
    hydrationMl: number
    sleepMinutes: number | null
    weightKg: number | null
  }
  totals: {
    workouts: number
    cardios: number
    cardioMinutes: number
    cardioDistanceKm: number
  }
  adherence: {
    nutrition: number
    hydration: number
    sleep: number
    training: number
  }
  personalRecords: Array<{
    exerciseName: string
    estimatedOneRepMaxKg: number
    localDate: string
  }>
}
