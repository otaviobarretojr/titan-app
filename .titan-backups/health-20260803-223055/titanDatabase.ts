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

export type ExercisePlanRecord = {
  id: string
  userId: string
  workoutPlanId: string
  localDate: string
  name: string
  muscleGroup: string
  sequence: number
  targetSets: number
  minReps: number
  maxReps: number
  targetRir: number
  restSeconds: number
  previousLoadKg: number | null
  createdAt: string
  updatedAt: string
}

export type WorkoutSessionRecord = {
  id: string
  userId: string
  workoutPlanId: string
  localDate: string
  status: 'started' | 'completed'
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ExerciseSetRecord = {
  id: string
  userId: string
  workoutSessionId: string
  exercisePlanId: string
  localDate: string
  setNumber: number
  loadKg: number
  repetitions: number
  rir: number
  completedAt: string
  createdAt: string
  updatedAt: string
}



export type BodyMetricRecord = {
  id: string
  userId: string
  localDate: string
  weightKg: number
  waistCm: number | null
  armCm: number | null
  chestCm: number | null
  thighCm: number | null
  calfCm: number | null
  bodyFatPercentage: number | null
  notes: string
  createdAt: string
  updatedAt: string
}


export type ProgressPhotoRecord = {
  id: string
  userId: string
  localDate: string
  imageDataUrl: string
  pose: 'front' | 'side' | 'back' | 'other'
  notes: string
  createdAt: string
  updatedAt: string
}

export type CardioPlanRecord = {
  id: string
  userId: string
  localDate: string
  type: 'walking' | 'zone2' | 'running' | 'hiit'
  title: string
  plannedTime: string
  targetDurationMinutes: number
  targetDistanceKm: number | null
  createdAt: string
  updatedAt: string
}

export type CardioSessionRecord = {
  id: string
  userId: string
  cardioPlanId: string
  localDate: string
  status: 'started' | 'completed' | 'cancelled'
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  notes: string
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}


export type ExercisePersonalRecord = {
  id: string
  userId: string
  exercisePlanId: string
  exerciseName: string
  localDate: string
  loadKg: number
  repetitions: number
  estimatedOneRepMaxKg: number
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
  exercisePlans!: EntityTable<ExercisePlanRecord, 'id'>
  workoutSessions!: EntityTable<WorkoutSessionRecord, 'id'>
  exerciseSets!: EntityTable<ExerciseSetRecord, 'id'>
  bodyMetrics!: EntityTable<BodyMetricRecord, 'id'>
  progressPhotos!: EntityTable<ProgressPhotoRecord, 'id'>
  cardioPlans!: EntityTable<CardioPlanRecord, 'id'>
  cardioSessions!: EntityTable<CardioSessionRecord, 'id'>
  exercisePersonalRecords!: EntityTable<ExercisePersonalRecord, 'id'>
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

    this.version(2).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })
    this.version(3).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })

    this.version(4).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })

    this.version(5).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, name, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      exercisePersonalRecords:
        'id, userId, exercisePlanId, exerciseName, localDate, estimatedOneRepMaxKg, [userId+exercisePlanId]',
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })

    this.version(6).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, name, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      exercisePersonalRecords:
        'id, userId, exercisePlanId, exerciseName, localDate, estimatedOneRepMaxKg, [userId+exercisePlanId]',
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      progressPhotos: 'id, userId, localDate, pose, [userId+localDate]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })

  }
}

export const titanDatabase = new TitanDatabase()
