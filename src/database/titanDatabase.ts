import Dexie, { type EntityTable } from 'dexie'
import type { NotificationInboxItem, NotificationPreference } from '../modules/notifications/types/notifications'
import type * as Nutrition from '../modules/nutrition/types/foundation'

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
  rightArmCm?: number | null
  leftArmCm?: number | null
  rightThighCm?: number | null
  leftThighCm?: number | null
  rightCalfCm?: number | null
  leftCalfCm?: number | null
  hipCm?: number | null
  neckCm?: number | null
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
  pose: 'front' | 'side' | 'back' | 'other' | 'right-side' | 'left-side'
  weightKg?: number | null
  notes: string
  createdAt: string
  updatedAt: string
}

export type BioimpedanceRecord = {
  id: string
  userId: string
  localDate: string
  bodyFatPercentage: number | null
  muscleMassKg: number | null
  leanMassKg: number | null
  visceralFat: number | null
  bodyWaterPercentage: number | null
  basalMetabolicRateKcal: number | null
  metabolicAge: number | null
  equipment: string
  conditions: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type HealthMetricRecord = {
  id: string
  userId: string
  localDate: string
  systolicPressure: number | null
  diastolicPressure: number | null
  restingHeartRate: number | null
  symptom: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type HealthExamRecord = {
  id: string
  userId: string
  examDate: string
  title: string
  category: string
  value: string
  referenceRange: string
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


export type ActivePlanType = 'workout' | 'nutrition' | 'cardio' | 'supplements'

export type UserProfileRecord = {
  id: string
  name: string
  displayName: string
  birthDate?: string | null
  sex?: 'female' | 'male' | 'other' | 'not_informed' | null
  heightCm: number
  weightKg: number
  goal: string
  experience: 'beginner' | 'intermediate' | 'advanced'
  trainingDays: string[]
  wakeTime: string
  workStartTime: string
  workEndTime: string
  trainingTime: string
  sleepTime: string
  timezone: string
  calorieTargetKcal: number
  proteinTargetG: number
  carbohydrateTargetG: number
  fatTargetG: number
  waterTargetMl: number
  sleepTargetMinutes: number
  preferences: { notes: string; foodPreferences: string[]; restrictions: string[] }
  createdAt: string
  updatedAt: string
}

export type ActivePlanRecord = {
  id: string
  type: ActivePlanType
  title: string
  author: string
  sourceFileName: string
  payload: unknown
  importedAt: string
  createdAt: string
  updatedAt: string
}

export type ImportHistoryRecord = {
  id: string
  importedAt: string
  type: 'profile' | ActivePlanType | 'project'
  title: string
  author: string
  fileName: string
  status: 'success' | 'failure'
  message: string
}

export type AppPreferencesRecord = {
  id: string
  theme: 'system' | 'light' | 'dark'
  onboardingStatus: 'pending' | 'completed' | 'skipped'
  reduceAnimations: boolean
  highContrast: boolean
  updateChannel: 'stable'
  lastUpdateCheckAt?: string | null
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
  insightKey?: string
  category?: string
  evidence?: string
  period?: string
  sampleSize?: number
  action?: string
  actionPath?: string
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
  bioimpedance!: EntityTable<BioimpedanceRecord, 'id'>
  healthMetrics!: EntityTable<HealthMetricRecord, 'id'>
  healthExams!: EntityTable<HealthExamRecord, 'id'>
  cardioPlans!: EntityTable<CardioPlanRecord, 'id'>
  cardioSessions!: EntityTable<CardioSessionRecord, 'id'>
  exercisePersonalRecords!: EntityTable<ExercisePersonalRecord, 'id'>
  hydrationEntries!: EntityTable<HydrationEntryRecord, 'id'>
  sleepEntries!: EntityTable<SleepEntryRecord, 'id'>
  coachRecommendations!: EntityTable<CoachRecommendationRecord, 'id'>
  notificationPreferences!: EntityTable<NotificationPreference, 'id'>
  notificationInbox!: EntityTable<NotificationInboxItem, 'id'>
  userProfile!: EntityTable<UserProfileRecord, 'id'>
  activePlans!: EntityTable<ActivePlanRecord, 'id'>
  importHistory!: EntityTable<ImportHistoryRecord, 'id'>
  appPreferences!: EntityTable<AppPreferencesRecord, 'id'>
  nutritionDataSources!: EntityTable<Nutrition.NutritionDataSourceRecord, 'id'>
  nutritionSourceImports!: EntityTable<Nutrition.NutritionSourceImportRecord, 'id'>
  foodCategories!: EntityTable<Nutrition.FoodCategoryRecord, 'id'>
  foodLibrary!: EntityTable<Nutrition.FoodLibraryRecord, 'id'>
  foodAliases!: EntityTable<Nutrition.FoodAliasRecord, 'id'>
  foodNutrients!: EntityTable<Nutrition.FoodNutrientRecord, 'id'>
  foodHouseholdMeasures!: EntityTable<Nutrition.FoodHouseholdMeasureRecord, 'id'>
  foodYieldFactors!: EntityTable<Nutrition.FoodYieldFactorRecord, 'id'>
  foodSubstitutions!: EntityTable<Nutrition.FoodSubstitutionRecord, 'id'>
  recipes!: EntityTable<Nutrition.RecipeRecord, 'id'>
  recipeIngredients!: EntityTable<Nutrition.RecipeIngredientRecord, 'id'>
  nutritionPlans!: EntityTable<Nutrition.NutritionPlanRecord, 'id'>
  nutritionPlanDays!: EntityTable<Nutrition.NutritionPlanDayRecord, 'id'>
  plannedMeals!: EntityTable<Nutrition.PlannedMealRecord, 'id'>
  plannedFoods!: EntityTable<Nutrition.PlannedFoodRecord, 'id'>
  mealExecutions!: EntityTable<Nutrition.MealExecutionRecord, 'id'>
  foodExecutions!: EntityTable<Nutrition.FoodExecutionRecord, 'id'>
  shoppingLists!: EntityTable<Nutrition.ShoppingListRecord, 'id'>
  shoppingListItems!: EntityTable<Nutrition.ShoppingListItemRecord, 'id'>
  pantryItems!: EntityTable<Nutrition.PantryItemRecord, 'id'>

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

    this.version(7).stores({
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
      healthMetrics: 'id, userId, localDate, [userId+localDate]',
      healthExams: 'id, userId, examDate, category, [userId+examDate]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })

    // Date-range screens use the user/date compound keys below. Keeping the
    // sort key in the meal-plan index also lets the dashboard read today's
    // meals in display order without an in-memory sort.
    this.version(8).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate], [userId+localDate+sequence]',
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
        'id, userId, exercisePlanId, exerciseName, localDate, estimatedOneRepMaxKg, [userId+exercisePlanId], [userId+localDate]',
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      progressPhotos: 'id, userId, localDate, pose, [userId+localDate]',
      healthMetrics: 'id, userId, localDate, [userId+localDate]',
      healthExams: 'id, userId, examDate, category, [userId+examDate]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })

    // Optional fields keep recommendation rows from every previous schema
    // readable while adding indexes for history and repetition control.
    this.version(9).stores({
      coachRecommendations:
        'id, userId, localDate, priority, insightKey, category, createdAt, [userId+localDate], [userId+insightKey]',
    })

    // Additive schema: legacy body metrics and photos remain readable. New
    // optional fields need no artificial backfill.
    this.version(10).stores({
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      progressPhotos: 'id, userId, localDate, pose, [userId+localDate], [userId+pose]',
      bioimpedance: 'id, userId, localDate, [userId+localDate]',
    })


    // Sprint 014: local notification preferences and inbox. Additive only; no
    // backfill is required, so legacy IndexedDB data remains intact.
    this.version(11).stores({
      notificationPreferences:
        'id, userId, category, enabled, nextRunAt, [userId+category]',
      notificationInbox:
        'id, userId, category, priority, createdAt, readAt, dismissedAt, dedupeKey, [userId+createdAt], [userId+dedupeKey]',
    })

    // Release v1.0.3: additive stores for profile, independent active plans,
    // sanitized import history and app preferences. Legacy tables remain intact.
    this.version(12).stores({
      userProfile: 'id, displayName, updatedAt',
      activePlans: 'id, type, importedAt, updatedAt',
      importHistory: 'id, importedAt, type, status',
      appPreferences: 'id, theme, onboardingStatus, updatedAt',
    }).upgrade(async (tx) => {
      const table = tx.table('appPreferences')
      const now = new Date().toISOString()
      const legacyTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('titan-theme') : null
      const theme = legacyTheme === 'premium' || legacyTheme === 'amoled' || legacyTheme === 'dark' ? 'dark' : legacyTheme === 'light' || legacyTheme === 'system' ? legacyTheme : 'system'
      await table.put({ id: 'app', theme, onboardingStatus: 'pending', reduceAnimations: false, highContrast: false, updateChannel: 'stable', createdAt: now, updatedAt: now })
    })

    // v1.0.4 is strictly additive: every v1.0.3 store and row is retained.
    this.version(13).stores({
      nutritionDataSources: 'id, type, name, updatedAt',
      nutritionSourceImports: 'id, sourceId, checksum, status, importedAt, createdAt, updatedAt',
      foodCategories: 'id, normalizedName, createdAt, updatedAt',
      foodLibrary: 'id, sourceId, sourceFoodId, normalizedName, categoryId, [sourceId+sourceFoodId], createdAt, updatedAt',
      foodAliases: 'id, foodId, normalizedName, createdAt, updatedAt',
      foodNutrients: 'id, foodId, nutrient, createdAt, updatedAt',
      foodHouseholdMeasures: 'id, foodId, unit, createdAt, updatedAt',
      foodYieldFactors: 'id, foodId, fromState, toState, createdAt, updatedAt',
      foodSubstitutions: 'id, foodId, substituteFoodId, createdAt, updatedAt',
      recipes: 'id, userId, name, createdAt, updatedAt', recipeIngredients: 'id, recipeId, foodId, createdAt, updatedAt',
      nutritionPlans: 'id, userId, status, createdAt, updatedAt', nutritionPlanDays: 'id, planId, userId, localDate, createdAt, updatedAt',
      plannedMeals: 'id, planId, planDayId, userId, localDate, status, createdAt, updatedAt', plannedFoods: 'id, plannedMealId, foodId, createdAt, updatedAt',
      mealExecutions: 'id, plannedMealId, userId, localDate, status, createdAt, updatedAt', foodExecutions: 'id, mealExecutionId, foodId, createdAt, updatedAt',
      shoppingLists: 'id, userId, weekStartDate, status, createdAt, updatedAt', shoppingListItems: 'id, shoppingListId, foodId, status, createdAt, updatedAt',
      pantryItems: 'id, userId, foodId, createdAt, updatedAt',
    })
  }
}

export const titanDatabase = new TitanDatabase()
