export type DashboardMeal = {
  id: string
  name: string
  plannedTime: string
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
}

export type DashboardWorkout = {
  id: string
  name: string
  plannedTime: string
  exerciseCount: number
  estimatedDurationMinutes: number
}

export type DashboardCoachMessage = {
  id: string
  title: string
  message: string
}

export type DashboardSummary = {
  caloriesConsumedKcal: number
  proteinConsumedG: number
  hydrationConsumedMl: number
  sleepMinutes: number | null
  calorieTargetKcal: number
  proteinTargetG: number
  hydrationTargetMl: number
  sleepTargetMinutes: number
}

export type DashboardData = {
  userName: string
  nextMeal: DashboardMeal | null
  workout: DashboardWorkout | null
  coachMessage: DashboardCoachMessage | null
  summary: DashboardSummary
}
