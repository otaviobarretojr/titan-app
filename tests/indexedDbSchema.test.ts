import { describe, expect, it } from 'vitest'
import { titanDatabase } from '../src/database/titanDatabase'

describe('IndexedDB schema', () => {
  it('mantém a versão Dexie mais recente e as tabelas críticas registradas', () => {
    expect(titanDatabase.verno).toBe(10)
    expect(titanDatabase.tables.map((table) => table.name).sort()).toEqual([
      'bioimpedance',
      'bodyMetrics',
      'cardioPlans',
      'cardioSessions',
      'coachRecommendations',
      'dailyPlans',
      'exercisePersonalRecords',
      'exercisePlans',
      'exerciseSets',
      'healthExams',
      'healthMetrics',
      'hydrationEntries',
      'mealEntries',
      'mealPlans',
      'progressPhotos',
      'sleepEntries',
      'users',
      'workoutPlans',
      'workoutSessions',
    ])
  })

  it('preserva índices compostos usados por telas offline e relatórios', () => {
    expect(titanDatabase.mealPlans.schema.indexes.map((index) => index.name)).toContain('[userId+localDate+sequence]')
    expect(titanDatabase.progressPhotos.schema.indexes.map((index) => index.name)).toContain('[userId+pose]')
    expect(titanDatabase.coachRecommendations.schema.indexes.map((index) => index.name)).toContain('[userId+insightKey]')
  })
})
