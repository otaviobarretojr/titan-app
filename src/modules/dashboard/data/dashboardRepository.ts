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
    activePlans,
    profile,
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
      titanDatabase.activePlans,
      titanDatabase.userProfile,
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
        titanDatabase.activePlans.toArray(),
        titanDatabase.userProfile.get('default'),
      ]),
  )

  const activePlanByType = new Map(activePlans.map((plan) => [plan.type, plan]))
  if (!user || !dailyPlan) {
    const emptyScore = calculateTitanScore({
      currentMinutes: getTitanCurrentMinutes(),
      proteinConsumedG: 0,
      proteinTargetG: 0,
      caloriesConsumedKcal: 0,
      calorieTargetKcal: 0,
      hydrationConsumedMl: 0,
      hydrationTargetMl: 0,
      sleepMinutes: null,
      sleepTargetMinutes: 0,
      pendingMeals: 0,
      workoutStatus: 'none',
      cardioStatus: 'none',
      plannedWorkoutMinutes: null,
      consistency: 0,
      hasNutritionData: false,
      hasHydrationData: false,
      hasConsistencyData: false,
    })

    return {
      userName: profile?.displayName ?? user?.displayName ?? 'Atleta',
      pendingMeals: 0,
      weight: { currentKg: null, changeKg: null },
      nextMeal: buildPlannedMeal(activePlanByType.get('nutrition')?.payload),
      workout: buildPlannedWorkout(activePlanByType.get('workout')?.payload),
      cardio: buildPlannedCardio(activePlanByType.get('cardio')?.payload),
      insights: [],
      score: emptyScore,
      summary: {
        caloriesConsumedKcal: 0,
        proteinConsumedG: 0,
        hydrationConsumedMl: 0,
        sleepMinutes: null,
        calorieTargetKcal: 0,
        proteinTargetG: 0,
        hydrationTargetMl: 0,
        sleepTargetMinutes: 0,
      },
    }
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

  const highlightedMeal =
    unresolvedMeals.find(
      (meal) =>
        timeToMinutes(meal.plannedTime) >=
        currentMinutes,
    ) ??
    unresolvedMeals[0] ??
    meals.find((meal) => mealEntryByPlanId.get(meal.id)?.status !== 'skipped') ??
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
      profile?.displayName ?? user.displayName,

    pendingMeals: pendingMeals.length,

    weight: {
      currentKg: bodyMetrics.at(-1)?.weightKg ?? null,
      changeKg: bodyMetrics.length > 1
        ? Number((bodyMetrics.at(-1)!.weightKg - bodyMetrics.at(-2)!.weightKg).toFixed(1))
        : null,
    },

    nextMeal:
      highlightedMeal
        ? {
            id:
              highlightedMeal.id,

            name:
              highlightedMeal.name,

            plannedTime:
              highlightedMeal.plannedTime,

            caloriesKcal:
              highlightedMeal.caloriesKcal,

            proteinG:
              highlightedMeal.proteinG,

            status: mealEntryByPlanId.has(highlightedMeal.id)
              ? 'completed'
              : timeToMinutes(highlightedMeal.plannedTime) < currentMinutes
                ? 'overdue'
                : 'normal',
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


function buildPlannedMeal(payload: unknown) {
  const meal = (payload as { meals?: Array<{ id: string; name: string; plannedTime: string; caloriesKcal: number; proteinG: number }> } | undefined)?.meals?.[0]
  return meal ? { id: meal.id, name: meal.name, plannedTime: meal.plannedTime, caloriesKcal: meal.caloriesKcal, proteinG: meal.proteinG, status: 'normal' as const } : null
}
function buildPlannedWorkout(payload: unknown) {
  const day = (payload as { days?: Array<{ id: string; title: string; plannedTime: string; estimatedDurationMinutes: number; exercises: unknown[] }> } | undefined)?.days?.[0]
  return day ? { id: day.id, name: day.title, plannedTime: day.plannedTime, exerciseCount: day.exercises.length, estimatedDurationMinutes: day.estimatedDurationMinutes, status: 'planned' as const } : null
}
function buildPlannedCardio(payload: unknown) {
  const session = (payload as { sessions?: Array<{ id: string; title: string; plannedTime: string; targetDurationMinutes: number }> } | undefined)?.sessions?.[0]
  return session ? { id: session.id, title: session.title, plannedTime: session.plannedTime, targetDurationMinutes: session.targetDurationMinutes, status: 'planned' as const } : null
}
