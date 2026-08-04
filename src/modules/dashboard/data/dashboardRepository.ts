import Dexie from 'dexie'
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
import {
  calculateTitanScore,
  generateCoachInsights,
} from '../../coach/engine/coachEngine'
import type { DashboardData } from '../types/dashboard'

export async function getDashboardData(): Promise<DashboardData | null> {
  const localDate = getTitanLocalDate()

  const [
    user,
    dailyPlan,
    meals,
    mealEntries,
    workout,
    workoutSession,
    cardioPlan,
    cardioSession,
    hydrationEntries,
    sleepEntry,
    bodyMetrics,
  ] = await titanDatabase.transaction(
    'r',
    [
      titanDatabase.users,
      titanDatabase.dailyPlans,
      titanDatabase.mealPlans,
      titanDatabase.mealEntries,
      titanDatabase.workoutPlans,
      titanDatabase.workoutSessions,
      titanDatabase.cardioPlans,
      titanDatabase.cardioSessions,
      titanDatabase.hydrationEntries,
      titanDatabase.sleepEntries,
      titanDatabase.bodyMetrics,
    ],
    () =>
      Promise.all([
        titanDatabase.users.get(TITAN_USER_ID),
        titanDatabase.dailyPlans
          .where('[userId+localDate]')
          .equals([TITAN_USER_ID, localDate])
          .first(),
        titanDatabase.mealPlans
          .where('[userId+localDate+sequence]')
          .between(
            [TITAN_USER_ID, localDate, Dexie.minKey],
            [TITAN_USER_ID, localDate, Dexie.maxKey],
          )
          .toArray(),
        titanDatabase.mealEntries
          .where('[userId+localDate]')
          .equals([TITAN_USER_ID, localDate])
          .toArray(),
        titanDatabase.workoutPlans
          .where('[userId+localDate]')
          .equals([TITAN_USER_ID, localDate])
          .first(),
        titanDatabase.workoutSessions
          .where('[userId+localDate]')
          .equals([TITAN_USER_ID, localDate])
          .first(),
        titanDatabase.cardioPlans
          .where('[userId+localDate]')
          .equals([TITAN_USER_ID, localDate])
          .first(),
        titanDatabase.cardioSessions
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
        titanDatabase.bodyMetrics
          .where('userId')
          .equals(TITAN_USER_ID)
          .sortBy('localDate'),
      ]),
  )

  if (!user || !dailyPlan) {
    return null
  }

  const currentMinutes = getTitanCurrentMinutes()

  const mealEntryByPlanId = new Map(
    mealEntries.map((entry) => [
      entry.mealPlanId,
      entry,
    ]),
  )

  const unresolvedMeals = meals.filter(
    (meal) => !mealEntryByPlanId.has(meal.id),
  )

  const pendingMeals = unresolvedMeals.filter(
    (meal) =>
      timeToMinutes(meal.plannedTime) <
      currentMinutes,
  )

  const nextMeal =
    unresolvedMeals.find(
      (meal) =>
        timeToMinutes(meal.plannedTime) >=
        currentMinutes,
    ) ??
    unresolvedMeals[0] ??
    null

  const caloriesConsumedKcal =
    mealEntries.reduce(
      (total, entry) =>
        total + entry.caloriesKcal,
      0,
    )

  const proteinConsumedG =
    mealEntries.reduce(
      (total, entry) =>
        total + entry.proteinG,
      0,
    )

  const hydrationConsumedMl =
    hydrationEntries.reduce(
      (total, entry) =>
        total + entry.amountMl,
      0,
    )

  const completedMeals =
    mealEntries.filter(
      (entry) =>
        entry.status !== 'skipped',
    ).length

  const consistency =
    meals.length > 0
      ? Math.round(
          (completedMeals / meals.length) * 100,
        )
      : 0

  const workoutStatus =
    workoutSession?.status === 'completed'
      ? 'completed'
      : workoutSession?.status === 'started'
        ? 'started'
        : workout
          ? 'planned'
          : 'none'

  const cardioStatus =
    cardioSession?.status === 'completed'
      ? 'completed'
      : cardioSession?.status === 'started'
        ? 'started'
        : cardioPlan
          ? 'planned'
          : 'none'

  const engineInput = {
    currentMinutes,

    proteinConsumedG,
    proteinTargetG:
      dailyPlan.proteinTargetG,

    caloriesConsumedKcal,
    calorieTargetKcal:
      dailyPlan.calorieTargetKcal,

    hydrationConsumedMl,
    hydrationTargetMl:
      dailyPlan.hydrationTargetMl,

    sleepMinutes:
      sleepEntry?.durationMinutes ?? null,

    sleepTargetMinutes:
      dailyPlan.sleepTargetMinutes,

    pendingMeals:
      pendingMeals.length,

    workoutStatus,
    cardioStatus,

    plannedWorkoutMinutes:
      workout
        ? timeToMinutes(
            workout.plannedTime,
          )
        : null,

    consistency,
    hasNutritionData: mealEntries.length > 0,
    hasHydrationData: hydrationEntries.length > 0,
    hasConsistencyData: mealEntries.length > 0,
  } as const

  return {
    userName:
      user.displayName,

    pendingMeals: pendingMeals.length,

    weight: {
      currentKg: bodyMetrics.at(-1)?.weightKg ?? null,
      changeKg: bodyMetrics.length > 1
        ? Number((bodyMetrics.at(-1)!.weightKg - bodyMetrics.at(-2)!.weightKg).toFixed(1))
        : null,
    },

    nextMeal:
      nextMeal
        ? {
            id:
              nextMeal.id,

            name:
              nextMeal.name,

            plannedTime:
              nextMeal.plannedTime,

            caloriesKcal:
              nextMeal.caloriesKcal,

            proteinG:
              nextMeal.proteinG,
          }
        : null,

    workout:
      workout
        ? {
            id:
              workout.id,

            name:
              workout.name,

            plannedTime:
              workout.plannedTime,

            exerciseCount:
              workout.exerciseCount,

            estimatedDurationMinutes:
              workout.estimatedDurationMinutes,

            status:
              workoutStatus === 'none'
                ? 'planned'
                : workoutStatus,
          }
        : null,

    cardio:
      cardioPlan
        ? {
            id:
              cardioPlan.id,

            title:
              cardioPlan.title,

            plannedTime:
              cardioPlan.plannedTime,

            targetDurationMinutes:
              cardioPlan.targetDurationMinutes,

            status:
              cardioStatus === 'none'
                ? 'planned'
                : cardioStatus,
          }
        : null,

    insights:
      generateCoachInsights(
        engineInput,
      ),

    score:
      calculateTitanScore(
        engineInput,
      ),

    summary: {
      caloriesConsumedKcal,
      proteinConsumedG,
      hydrationConsumedMl,

      sleepMinutes:
        sleepEntry?.durationMinutes ??
        null,

      calorieTargetKcal:
        dailyPlan.calorieTargetKcal,

      proteinTargetG:
        dailyPlan.proteinTargetG,

      hydrationTargetMl:
        dailyPlan.hydrationTargetMl,

      sleepTargetMinutes:
        dailyPlan.sleepTargetMinutes,
    },
  }
}

export async function addHydration(
  amountMl: number,
) {
  if (
    !Number.isFinite(amountMl) ||
    amountMl <= 0
  ) {
    throw new Error(
      'Quantidade de água inválida.',
    )
  }

  const now =
    new Date().toISOString()

  const entry: HydrationEntryRecord = {
    id: `hydration-${crypto.randomUUID()}`,

    userId:
      TITAN_USER_ID,

    localDate:
      getTitanLocalDate(),

    amountMl,

    consumedAt:
      now,

    createdAt:
      now,

    updatedAt:
      now,
  }

  await titanDatabase
    .hydrationEntries
    .add(entry)
}
