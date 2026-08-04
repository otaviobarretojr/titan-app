import { describe, expect, it } from 'vitest'
import { titanDatabase } from '../src/database/titanDatabase'

describe('IndexedDB schema', () => {
  it('mantém a versão Dexie mais recente e as tabelas críticas registradas', () => {
    expect(titanDatabase.verno).toBe(11)

    const tableNames = titanDatabase.tables.map(
      (table) => table.name,
    )

    expect(tableNames).toEqual(
      expect.arrayContaining([
        'users',
        'dailyPlans',
        'mealPlans',
        'mealEntries',
        'hydrationEntries',
        'workoutPlans',
        'workoutSessions',
        'exercisePlans',
        'exerciseSets',
        'exercisePersonalRecords',
        'cardioPlans',
        'cardioSessions',
        'sleepEntries',
        'bodyMetrics',
        'bioimpedance',
        'progressPhotos',
        'healthMetrics',
        'healthExams',
        'coachRecommendations',
        'notificationPreferences',
        'notificationInbox',
      ]),
    )
  })
})
