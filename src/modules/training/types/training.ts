export type TrainingExercise = {
  id: string
  name: string
  muscleGroup: string
  sequence: number
  targetSets: number
  minReps: number
  maxReps: number
  targetRir: number
  restSeconds: number
  previousLoadKg: number | null
  completedSets: number
}

export type TrainingWorkout = {
  id: string
  name: string
  plannedTime: string
  estimatedDurationMinutes: number
  status: 'planned' | 'started' | 'completed'
  sessionId: string | null
  startedAt: string | null
  completedAt: string | null
  exercises: TrainingExercise[]
}
