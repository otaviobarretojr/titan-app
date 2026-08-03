import type {
  CoachInsight,
  TitanScore,
} from '../../coach/types/coach'

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
  status: 'planned' | 'started' | 'completed'
}

export type DashboardCardio = {
  id: string
  title: string
  plannedTime: string
  targetDurationMinutes: number
  status: 'planned' | 'started' | 'completed'
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
  cardio: DashboardCardio | null
  insights: CoachInsight[]
  score: TitanScore
  summary: DashboardSummary
}
