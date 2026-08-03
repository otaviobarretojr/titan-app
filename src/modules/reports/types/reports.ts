export type DailyReport = {
  localDate: string
  caloriesConsumedKcal: number
  proteinConsumedG: number
  hydrationConsumedMl: number
  sleepMinutes: number | null
  workoutCompleted: boolean
  cardioCompleted: boolean
  mealsCompleted: number
  mealsPlanned: number
}

export type WeeklyReport = {
  days: DailyReport[]
  averageCaloriesKcal: number
  averageProteinG: number
  averageHydrationMl: number
  averageSleepMinutes: number | null
  workoutCompletionRate: number
  cardioCompletionRate: number
  mealCompletionRate: number
}
