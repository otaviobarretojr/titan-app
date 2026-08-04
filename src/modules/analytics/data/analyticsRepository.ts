import type { Table } from 'dexie'
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

type DatedRecord = { localDate: string }

function groupByDate<T extends DatedRecord>(records: T[]) {
  const groups = new Map<string, T[]>()

  for (const record of records) {
    const group = groups.get(record.localDate)
    if (group) group.push(record)
    else groups.set(record.localDate, [record])
  }

  return groups
}

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

  if (dates.length === 0) {
    throw new Error('O período do Analytics deve ter ao menos um dia.')
  }

  const dateRange = {
    lower: [TITAN_USER_ID, dates[0]] as [string, string],
    upper: [TITAN_USER_ID, dates[dates.length - 1]] as [string, string],
  }

  const inPeriod = <T extends DatedRecord>(table: Table<T, string>) =>
    table
      .where('[userId+localDate]')
      .between(dateRange.lower, dateRange.upper, true, true)
      .toArray()

  const [
    dailyPlans,
    mealEntries,
    hydrationEntries,
    sleepEntries,
    workoutSessions,
    cardioSessions,
    bodyMetrics,
    personalRecords,
  ] = await titanDatabase.transaction(
    'r',
    [
      titanDatabase.dailyPlans,
      titanDatabase.mealEntries,
      titanDatabase.hydrationEntries,
      titanDatabase.sleepEntries,
      titanDatabase.workoutSessions,
      titanDatabase.cardioSessions,
      titanDatabase.bodyMetrics,
      titanDatabase.exercisePersonalRecords,
    ],
    () =>
      Promise.all([
        inPeriod(titanDatabase.dailyPlans),
        inPeriod(titanDatabase.mealEntries),
        inPeriod(titanDatabase.hydrationEntries),
        inPeriod(titanDatabase.sleepEntries),
        inPeriod(titanDatabase.workoutSessions),
        inPeriod(titanDatabase.cardioSessions),
        inPeriod(titanDatabase.bodyMetrics),
        titanDatabase.exercisePersonalRecords
          .where('userId')
          .equals(TITAN_USER_ID)
          .toArray(),
      ]),
  )

  const plansByDate = new Map(
    dailyPlans.map((item) => [item.localDate, item]),
  )

  const mealsByDate = groupByDate(mealEntries)
  const hydrationByDate = groupByDate(hydrationEntries)
  const sleepByDate = new Map(
    sleepEntries.map((item) => [item.localDate, item]),
  )
  const metricsByDate = new Map(
    bodyMetrics.map((item) => [item.localDate, item]),
  )
  const completedWorkoutDates = new Set(
    workoutSessions
      .filter((item) => item.status === 'completed')
      .map((item) => item.localDate),
  )
  const completedCardioDates = new Set(
    cardioSessions
      .filter((item) => item.status === 'completed')
      .map((item) => item.localDate),
  )

  const points: AnalyticsPoint[] = dates.map((localDate) => {
    const dayMeals = mealsByDate.get(localDate) ?? []
    const dayHydration = hydrationByDate.get(localDate) ?? []
    const daySleep = sleepByDate.get(localDate)
    const dayMetric = metricsByDate.get(localDate)

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
      workoutCompleted: completedWorkoutDates.has(localDate),
      cardioCompleted: completedCardioDates.has(localDate),
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
