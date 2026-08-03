import {
  getTitanCurrentMinutes,
  getTitanLocalDate,
  timeToMinutes,
} from '../../../database/date'
import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import {
  calculateTitanScore,
  generateCoachInsights,
  generateExecutiveSummary,
  generateWeeklyTrends,
} from '../engine/coachEngine'
import type { CoachReport } from '../types/coach'

function getPreviousDates(count: number) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dates: string[] = []

  for (let index = 0; index < count; index += 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatter.format(date))
  }

  return dates
}

export async function getCoachReport(): Promise<CoachReport | null> {
  const localDate = getTitanLocalDate()
  const lastSevenDates = getPreviousDates(7)

  const [
    dailyPlan,
    meals,
    mealEntries,
    hydrationEntries,
    sleepEntry,
    workout,
    workoutSession,
    cardioPlan,
    cardioSession,
    bodyMetrics,
    weeklyMeals,
    weeklyHydration,
    weeklySleep,
    weeklyWorkouts,
    weeklyCardio,
  ] = await Promise.all([
    titanDatabase.dailyPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.mealPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.mealEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.hydrationEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.sleepEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
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
    titanDatabase.bodyMetrics
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
    titanDatabase.mealEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.hydrationEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.sleepEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.workoutSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.cardioSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
  ])

  if (!dailyPlan) return null

  const currentMinutes = getTitanCurrentMinutes()

  const mealEntryByPlanId = new Map(
    mealEntries.map((entry) => [entry.mealPlanId, entry]),
  )

  const pendingMeals = meals.filter(
    (meal) =>
      !mealEntryByPlanId.has(meal.id) &&
      timeToMinutes(meal.plannedTime) < currentMinutes,
  ).length

  const caloriesConsumedKcal = mealEntries.reduce(
    (sum, item) => sum + item.caloriesKcal,
    0,
  )

  const proteinConsumedG = mealEntries.reduce(
    (sum, item) => sum + item.proteinG,
    0,
  )

  const hydrationConsumedMl = hydrationEntries.reduce(
    (sum, item) => sum + item.amountMl,
    0,
  )

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

  const completedMeals = mealEntries.filter(
    (item) => item.status !== 'skipped',
  ).length

  const consistency =
    meals.length > 0
      ? Math.round((completedMeals / meals.length) * 100)
      : 0

  const engineInput = {
    currentMinutes,
    proteinConsumedG,
    proteinTargetG: dailyPlan.proteinTargetG,
    caloriesConsumedKcal,
    calorieTargetKcal: dailyPlan.calorieTargetKcal,
    hydrationConsumedMl,
    hydrationTargetMl: dailyPlan.hydrationTargetMl,
    sleepMinutes: sleepEntry?.durationMinutes ?? null,
    sleepTargetMinutes: dailyPlan.sleepTargetMinutes,
    pendingMeals,
    workoutStatus,
    cardioStatus,
    plannedWorkoutMinutes: workout
      ? timeToMinutes(workout.plannedTime)
      : null,
    consistency,
  } as const

  const score = calculateTitanScore(engineInput)
  const dailyInsights = generateCoachInsights(engineInput)

  const weeklyTrends = generateWeeklyTrends({
    dates: lastSevenDates,
    proteinTargetG: dailyPlan.proteinTargetG,
    hydrationTargetMl: dailyPlan.hydrationTargetMl,
    sleepTargetMinutes: dailyPlan.sleepTargetMinutes,
    mealEntries: weeklyMeals,
    hydrationEntries: weeklyHydration,
    sleepEntries: weeklySleep,
    workoutSessions: weeklyWorkouts,
    cardioSessions: weeklyCardio,
    bodyMetrics,
  })

  return {
    generatedAt: new Date().toISOString(),
    dailyInsights,
    weeklyTrends,
    score,
    executiveSummary: generateExecutiveSummary({
      score,
      insights: dailyInsights,
      trends: weeklyTrends,
    }),
  }
}
