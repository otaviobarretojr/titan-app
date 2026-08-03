import {
  getTitanCurrentMinutes,
  getTitanLocalDate,
  timeToMinutes,
} from '../../../database/date'
import {
  titanDatabase,
  type MealEntryRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  MealStatus,
  NutritionDayData,
  NutritionMeal,
} from '../types/nutrition'

function createEntryId() {
  return `meal-entry-${crypto.randomUUID()}`
}

function resolveStatus(
  mealTime: string,
  entry: MealEntryRecord | undefined,
): MealStatus {
  if (entry) return entry.status

  return timeToMinutes(mealTime) < getTitanCurrentMinutes()
    ? 'pending'
    : 'planned'
}

export async function getNutritionDayData(): Promise<NutritionDayData | null> {
  const localDate = getTitanLocalDate()

  const [dailyPlan, mealPlans, mealEntries] = await Promise.all([
    titanDatabase.dailyPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.mealPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .sortBy('sequence'),
    titanDatabase.mealEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
  ])

  if (!dailyPlan) return null

  const entryByMealId = new Map(
    mealEntries.map((entry) => [entry.mealPlanId, entry]),
  )

  const meals: NutritionMeal[] = mealPlans.map((meal) => {
    const entry = entryByMealId.get(meal.id)

    return {
      id: meal.id,
      name: meal.name,
      plannedTime: meal.plannedTime,
      caloriesKcal: meal.caloriesKcal,
      proteinG: meal.proteinG,
      carbohydrateG: meal.carbohydrateG,
      fatG: meal.fatG,
      status: resolveStatus(meal.plannedTime, entry),
      consumedCaloriesKcal: entry?.caloriesKcal ?? 0,
      consumedProteinG: entry?.proteinG ?? 0,
      consumedCarbohydrateG: entry?.carbohydrateG ?? 0,
      consumedFatG: entry?.fatG ?? 0,
    }
  })

  return {
    localDate,
    meals,
    pendingCount: meals.filter((meal) => meal.status === 'pending').length,
    summary: {
      caloriesConsumedKcal: mealEntries.reduce(
        (total, entry) => total + entry.caloriesKcal,
        0,
      ),
      proteinConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.proteinG,
        0,
      ),
      carbohydrateConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.carbohydrateG,
        0,
      ),
      fatConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.fatG,
        0,
      ),
      calorieTargetKcal: dailyPlan.calorieTargetKcal,
      proteinTargetG: dailyPlan.proteinTargetG,
    },
  }
}

async function saveMealEntry(
  mealPlanId: string,
  status: MealEntryRecord['status'],
  fraction: number,
) {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()
  const meal = await titanDatabase.mealPlans.get(mealPlanId)

  if (!meal || meal.userId !== TITAN_USER_ID || meal.localDate !== localDate) {
    throw new Error('Refeição não encontrada.')
  }

  const existing = await titanDatabase.mealEntries
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((entry) => entry.mealPlanId === mealPlanId)
    .first()

  const entry: MealEntryRecord = {
    id: existing?.id ?? createEntryId(),
    userId: TITAN_USER_ID,
    mealPlanId,
    localDate,
    status,
    caloriesKcal: Math.round(meal.caloriesKcal * fraction),
    proteinG: Math.round(meal.proteinG * fraction),
    carbohydrateG: Math.round(meal.carbohydrateG * fraction),
    fatG: Math.round(meal.fatG * fraction),
    completedAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.mealEntries.put(entry)
}

export function completeMeal(mealPlanId: string) {
  return saveMealEntry(mealPlanId, 'completed', 1)
}

export function registerPartialMeal(
  mealPlanId: string,
  percentage: number,
) {
  const normalizedPercentage = Math.min(90, Math.max(10, percentage))
  return saveMealEntry(mealPlanId, 'partial', normalizedPercentage / 100)
}

export function substituteMeal(mealPlanId: string) {
  return saveMealEntry(mealPlanId, 'substituted', 1)
}

export function skipMeal(mealPlanId: string) {
  return saveMealEntry(mealPlanId, 'skipped', 0)
}

export async function clearMealEntry(mealPlanId: string) {
  const localDate = getTitanLocalDate()

  const existing = await titanDatabase.mealEntries
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((entry) => entry.mealPlanId === mealPlanId)
    .first()

  if (existing) {
    await titanDatabase.mealEntries.delete(existing.id)
  }
}
