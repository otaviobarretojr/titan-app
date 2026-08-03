import {
  getTitanCurrentMinutes,
  getTitanLocalDate,
  timeToMinutes,
} from '../../../database/date'
import {
  titanDatabase,
  type HydrationEntryRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { DashboardData } from '../types/dashboard'

export async function getDashboardData(): Promise<DashboardData | null> {
  const localDate = getTitanLocalDate()

  const [
    user,
    dailyPlan,
    meals,
    mealEntries,
    workout,
    coachMessage,
    hydrationEntries,
    sleepEntry,
  ] = await Promise.all([
    titanDatabase.users.get(TITAN_USER_ID),
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
    titanDatabase.workoutPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.coachRecommendations
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.hydrationEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.sleepEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
  ])

  if (!user || !dailyPlan) {
    return null
  }

  const completedMealIds = new Set(
    mealEntries
      .filter((entry) => entry.status !== 'skipped')
      .map((entry) => entry.mealPlanId),
  )

  const currentMinutes = getTitanCurrentMinutes()

  const nextMeal =
    meals.find(
      (meal) =>
        !completedMealIds.has(meal.id) &&
        timeToMinutes(meal.plannedTime) >= currentMinutes,
    ) ??
    meals.find((meal) => !completedMealIds.has(meal.id)) ??
    null

  return {
    userName: user.displayName,
    nextMeal: nextMeal
      ? {
          id: nextMeal.id,
          name: nextMeal.name,
          plannedTime: nextMeal.plannedTime,
          caloriesKcal: nextMeal.caloriesKcal,
          proteinG: nextMeal.proteinG,
          carbohydrateG: nextMeal.carbohydrateG,
          fatG: nextMeal.fatG,
        }
      : null,
    workout: workout
      ? {
          id: workout.id,
          name: workout.name,
          plannedTime: workout.plannedTime,
          exerciseCount: workout.exerciseCount,
          estimatedDurationMinutes: workout.estimatedDurationMinutes,
        }
      : null,
    coachMessage: coachMessage
      ? {
          id: coachMessage.id,
          title: coachMessage.title,
          message: coachMessage.message,
        }
      : null,
    summary: {
      caloriesConsumedKcal: mealEntries.reduce(
        (total, entry) => total + entry.caloriesKcal,
        0,
      ),
      proteinConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.proteinG,
        0,
      ),
      hydrationConsumedMl: hydrationEntries.reduce(
        (total, entry) => total + entry.amountMl,
        0,
      ),
      sleepMinutes: sleepEntry?.durationMinutes ?? null,
      calorieTargetKcal: dailyPlan.calorieTargetKcal,
      proteinTargetG: dailyPlan.proteinTargetG,
      hydrationTargetMl: dailyPlan.hydrationTargetMl,
      sleepTargetMinutes: dailyPlan.sleepTargetMinutes,
    },
  }
}

export async function addHydration(amountMl: number) {
  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    throw new Error('Quantidade de água inválida.')
  }

  const now = new Date().toISOString()

  const entry: HydrationEntryRecord = {
    id: `hydration-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate: getTitanLocalDate(),
    amountMl,
    consumedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.hydrationEntries.add(entry)
}
