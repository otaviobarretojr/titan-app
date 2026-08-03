import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  AnalyticsPoint,
  AnalyticsSummary,
} from '../types/analytics'
import {
  average,
  percentage,
} from '../utils/analyticsMath'

function getLastDates(count: number) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dates: string[] = []

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatter.format(date))
  }

  return dates
}

export async function getAnalyticsSummary(
  daysCount = 30,
): Promise<AnalyticsSummary> {
  const dates = getLastDates(daysCount)

  const [
    dailyPlans,
    mealEntries,
    hydrationEntries,
    sleepEntries,
    workoutSessions,
    cardioSessions,
    bodyMetrics,
    personalRecords,
  ] = await Promise.all([
    titanDatabase.dailyPlans
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.mealEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.hydrationEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.sleepEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.workoutSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.cardioSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.bodyMetrics
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.exercisePersonalRecords
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
  ])

  const plansByDate = new Map(
    dailyPlans.map((item) => [item.localDate, item]),
  )

  const points: AnalyticsPoint[] = dates.map((localDate) => {
    const dayMeals = mealEntries.filter(
      (item) => item.localDate === localDate,
    )
    const dayHydration = hydrationEntries.filter(
      (item) => item.localDate === localDate,
    )
    const daySleep = sleepEntries.find(
      (item) => item.localDate === localDate,
    )
    const dayWorkout = workoutSessions.find(
      (item) => item.localDate === localDate,
    )
    const dayCardio = cardioSessions.find(
      (item) => item.localDate === localDate,
    )
    const dayMetric = bodyMetrics.find(
      (item) => item.localDate === localDate,
    )

    return {
      localDate,
      caloriesKcal: dayMeals.reduce(
        (sum, item) => sum + item.caloriesKcal,
        0,
      ),
      proteinG: dayMeals.reduce(
        (sum, item) => sum + item.proteinG,
        0,
      ),
      hydrationMl: dayHydration.reduce(
        (sum, item) => sum + item.amountMl,
        0,
      ),
      sleepMinutes: daySleep?.durationMinutes ?? null,
      workoutCompleted: dayWorkout?.status === 'completed',
      cardioCompleted: dayCardio?.status === 'completed',
      weightKg: dayMetric?.weightKg ?? null,
      waistCm: dayMetric?.waistCm ?? null,
    }
  })

  const latestPlan =
    dailyPlans.sort((a, b) =>
      b.localDate.localeCompare(a.localDate),
    )[0] ?? null

  const workoutCount = points.filter(
    (item) => item.workoutCompleted,
  ).length

  const cardioCompleted = cardioSessions.filter(
    (item) => item.status === 'completed',
  )

  const nutritionAdherenceValues = points.map((point) => {
    const plan = plansByDate.get(point.localDate)
    if (!plan) return 0
    return percentage(point.proteinG, plan.proteinTargetG)
  })

  const hydrationAdherenceValues = points.map((point) => {
    const plan = plansByDate.get(point.localDate)
    if (!plan) return 0
    return percentage(point.hydrationMl, plan.hydrationTargetMl)
  })

  const sleepAdherenceValues = points
    .map((point) => {
      const plan = plansByDate.get(point.localDate)
      if (!plan || point.sleepMinutes === null) return null
      return percentage(point.sleepMinutes, plan.sleepTargetMinutes)
    })
    .filter((value): value is number => value !== null)

  const bestByExercise = new Map<
    string,
    (typeof personalRecords)[number]
  >()

  for (const record of personalRecords) {
    const current = bestByExercise.get(record.exerciseName)

    if (
      !current ||
      record.estimatedOneRepMaxKg >
        current.estimatedOneRepMaxKg
    ) {
      bestByExercise.set(record.exerciseName, record)
    }
  }

  return {
    days: points,
    averages: {
      caloriesKcal:
        Math.round(
          average(points.map((item) => item.caloriesKcal)) ?? 0,
        ),
      proteinG:
        Math.round(
          average(points.map((item) => item.proteinG)) ?? 0,
        ),
      hydrationMl:
        Math.round(
          average(points.map((item) => item.hydrationMl)) ?? 0,
        ),
      sleepMinutes: average(
        points
          .map((item) => item.sleepMinutes)
          .filter((value): value is number => value !== null),
      ),
      weightKg: average(
        points
          .map((item) => item.weightKg)
          .filter((value): value is number => value !== null),
      ),
    },
    totals: {
      workouts: workoutCount,
      cardios: cardioCompleted.length,
      cardioMinutes: cardioCompleted.reduce(
        (sum, item) => sum + item.durationMinutes,
        0,
      ),
      cardioDistanceKm: cardioCompleted.reduce(
        (sum, item) => sum + (item.distanceKm ?? 0),
        0,
      ),
    },
    adherence: {
      nutrition:
        Math.round(average(nutritionAdherenceValues) ?? 0),
      hydration:
        Math.round(average(hydrationAdherenceValues) ?? 0),
      sleep:
        Math.round(average(sleepAdherenceValues) ?? 0),
      training:
        latestPlan
          ? Math.round((workoutCount / daysCount) * 100)
          : 0,
    },
    personalRecords: [...bestByExercise.values()]
      .sort(
        (a, b) =>
          b.estimatedOneRepMaxKg -
          a.estimatedOneRepMaxKg,
      )
      .slice(0, 10)
      .map((record) => ({
        exerciseName: record.exerciseName,
        estimatedOneRepMaxKg:
          record.estimatedOneRepMaxKg,
        localDate: record.localDate,
      })),
  }
}
