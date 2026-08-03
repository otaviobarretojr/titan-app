import Dexie, { type EntityTable } from 'dexie'

export type UserRecord = {
  id: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export type DailyPlanRecord = {
  id: string
  userId: string
  localDate: string
  calorieTargetKcal: number
  proteinTargetG: number
  hydrationTargetMl: number
  sleepTargetMinutes: number
  createdAt: string
  updatedAt: string
}

export type MealPlanRecord = {
  id: string
  userId: string
  localDate: string
  name: string
  plannedTime: string
  sequence: number
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  createdAt: string
  updatedAt: string
}

export type MealEntryRecord = {
  id: string
  userId: string
  mealPlanId: string
  localDate: string
  status: 'partial' | 'completed' | 'substituted' | 'skipped'
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  completedAt: string
  createdAt: string
  updatedAt: string
}

export type WorkoutPlanRecord = {
  id: string
  userId: string
  localDate: string
  name: string
  plannedTime: string
  exerciseCount: number
  estimatedDurationMinutes: number
  createdAt: string
  updatedAt: string
}

export type HydrationEntryRecord = {
  id: string
  userId: string
  localDate: string
  amountMl: number
  consumedAt: string
  createdAt: string
  updatedAt: string
}

export type SleepEntryRecord = {
  id: string
  userId: string
  localDate: string
  durationMinutes: number
  createdAt: string
  updatedAt: string
}

export type CoachRecommendationRecord = {
  id: string
  userId: string
  localDate: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

class TitanDatabase extends Dexie {
  users!: EntityTable<UserRecord, 'id'>
  dailyPlans!: EntityTable<DailyPlanRecord, 'id'>
  mealPlans!: EntityTable<MealPlanRecord, 'id'>
  mealEntries!: EntityTable<MealEntryRecord, 'id'>
  workoutPlans!: EntityTable<WorkoutPlanRecord, 'id'>
  hydrationEntries!: EntityTable<HydrationEntryRecord, 'id'>
  sleepEntries!: EntityTable<SleepEntryRecord, 'id'>
  coachRecommendations!: EntityTable<CoachRecommendationRecord, 'id'>

  constructor() {
    super('titan-database')

    this.version(1).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })
  }
}

export const titanDatabase = new TitanDatabase()
