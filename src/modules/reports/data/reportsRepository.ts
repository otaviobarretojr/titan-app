import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  DailyReport,
  WeeklyReport,
} from '../types/reports'

function getLastDates(count: number) {
  const dates: string[] = []
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatter.format(date))
  }

  return dates
}

export async function getDailyReport(
  localDate: string,
): Promise<DailyReport> {
  const [
    mealPlans,
    mealEntries,
    hydrationEntries,
    sleepEntry,
    workoutSession,
    cardioSession,
  ] = await Promise.all([
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
    titanDatabase.workoutSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.cardioSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
  ])

  return {
    localDate,
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
    workoutCompleted: workoutSession?.status === 'completed',
    cardioCompleted: cardioSession?.status === 'completed',
    mealsCompleted: mealEntries.filter(
      (entry) => entry.status !== 'skipped',
    ).length,
    mealsPlanned: mealPlans.length,
  }
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  const dates = getLastDates(7)
  const days = await Promise.all(dates.map(getDailyReport))

  const total = (selector: (day: DailyReport) => number) =>
    days.reduce((sum, day) => sum + selector(day), 0)

  const sleepDays = days.filter((day) => day.sleepMinutes !== null)

  const plannedMeals = total((day) => day.mealsPlanned)
  const completedMeals = total((day) => day.mealsCompleted)

  return {
    days,
    averageCaloriesKcal: Math.round(
      total((day) => day.caloriesConsumedKcal) / days.length,
    ),
    averageProteinG: Math.round(
      total((day) => day.proteinConsumedG) / days.length,
    ),
    averageHydrationMl: Math.round(
      total((day) => day.hydrationConsumedMl) / days.length,
    ),
    averageSleepMinutes:
      sleepDays.length > 0
        ? Math.round(
            sleepDays.reduce(
              (sum, day) => sum + (day.sleepMinutes ?? 0),
              0,
            ) / sleepDays.length,
          )
        : null,
    workoutCompletionRate: Math.round(
      (days.filter((day) => day.workoutCompleted).length / days.length) *
        100,
    ),
    cardioCompletionRate: Math.round(
      (days.filter((day) => day.cardioCompleted).length / days.length) *
        100,
    ),
    mealCompletionRate:
      plannedMeals > 0
        ? Math.round((completedMeals / plannedMeals) * 100)
        : 0,
  }
}
