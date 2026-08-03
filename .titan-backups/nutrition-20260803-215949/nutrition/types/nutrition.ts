export type MealStatus =
  | 'planned'
  | 'pending'
  | 'partial'
  | 'completed'
  | 'substituted'
  | 'skipped'

export type NutritionMeal = {
  id: string
  name: string
  plannedTime: string
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  status: MealStatus
  consumedCaloriesKcal: number
  consumedProteinG: number
  consumedCarbohydrateG: number
  consumedFatG: number
}

export type NutritionDaySummary = {
  caloriesConsumedKcal: number
  proteinConsumedG: number
  carbohydrateConsumedG: number
  fatConsumedG: number
  calorieTargetKcal: number
  proteinTargetG: number
}

export type NutritionDayData = {
  localDate: string
  meals: NutritionMeal[]
  summary: NutritionDaySummary
  pendingCount: number
}
