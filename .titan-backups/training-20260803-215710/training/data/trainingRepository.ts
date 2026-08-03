import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type ExerciseSetRecord,
  type WorkoutSessionRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { TrainingWorkout } from '../types/training'

export async function getTrainingWorkout(): Promise<TrainingWorkout | null> {
  const localDate = getTitanLocalDate()

  const workout = await titanDatabase.workoutPlans
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  if (!workout) return null

  const [exercises, session] = await Promise.all([
    titanDatabase.exercisePlans
      .where('workoutPlanId')
      .equals(workout.id)
      .sortBy('sequence'),
    titanDatabase.workoutSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
  ])

  const sets = session
    ? await titanDatabase.exerciseSets
        .where('workoutSessionId')
        .equals(session.id)
        .toArray()
    : []

  const completedSetCount = new Map<string, number>()

  for (const set of sets) {
    completedSetCount.set(
      set.exercisePlanId,
      (completedSetCount.get(set.exercisePlanId) ?? 0) + 1,
    )
  }

  return {
    id: workout.id,
    name: workout.name,
    plannedTime: workout.plannedTime,
    estimatedDurationMinutes: workout.estimatedDurationMinutes,
    status: session?.status ?? 'planned',
    sessionId: session?.id ?? null,
    startedAt: session?.startedAt ?? null,
    completedAt: session?.completedAt ?? null,
    exercises: exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sequence: exercise.sequence,
      targetSets: exercise.targetSets,
      minReps: exercise.minReps,
      maxReps: exercise.maxReps,
      targetRir: exercise.targetRir,
      restSeconds: exercise.restSeconds,
      previousLoadKg: exercise.previousLoadKg,
      completedSets: completedSetCount.get(exercise.id) ?? 0,
    })),
  }
}

export async function startWorkout(workoutPlanId: string) {
  const localDate = getTitanLocalDate()
  const existing = await titanDatabase.workoutSessions
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  if (existing) return existing.id

  const now = new Date().toISOString()
  const session: WorkoutSessionRecord = {
    id: `workout-session-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    workoutPlanId,
    localDate,
    status: 'started',
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.workoutSessions.add(session)
  return session.id
}

export async function addExerciseSet(input: {
  workoutSessionId: string
  exercisePlanId: string
  loadKg: number
  repetitions: number
  rir: number
}) {
  if (input.loadKg < 0) throw new Error('Carga inválida.')
  if (input.repetitions <= 0) throw new Error('Repetições inválidas.')
  if (input.rir < 0 || input.rir > 10) throw new Error('RIR inválido.')

  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  const existingSets = await titanDatabase.exerciseSets
    .where('[workoutSessionId+exercisePlanId]')
    .equals([input.workoutSessionId, input.exercisePlanId])
    .count()

  const set: ExerciseSetRecord = {
    id: `exercise-set-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    workoutSessionId: input.workoutSessionId,
    exercisePlanId: input.exercisePlanId,
    localDate,
    setNumber: existingSets + 1,
    loadKg: input.loadKg,
    repetitions: input.repetitions,
    rir: input.rir,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.exerciseSets.add(set)
}

export async function removeLastExerciseSet(
  workoutSessionId: string,
  exercisePlanId: string,
) {
  const sets = await titanDatabase.exerciseSets
    .where('[workoutSessionId+exercisePlanId]')
    .equals([workoutSessionId, exercisePlanId])
    .sortBy('setNumber')

  const lastSet = sets.at(-1)

  if (lastSet) {
    await titanDatabase.exerciseSets.delete(lastSet.id)
  }
}

export async function finishWorkout(workoutSessionId: string) {
  const session = await titanDatabase.workoutSessions.get(workoutSessionId)

  if (!session) throw new Error('Sessão de treino não encontrada.')

  const now = new Date().toISOString()

  await titanDatabase.workoutSessions.update(workoutSessionId, {
    status: 'completed',
    completedAt: now,
    updatedAt: now,
  })
}
