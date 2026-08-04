import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type ExercisePersonalRecord,
  type ExerciseSetRecord,
  type WorkoutSessionRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { TrainingWorkout } from '../types/training'
import {
  estimateOneRepMax,
  getProgressionSuggestion,
} from '../utils/trainingMath'

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

  const prs = await Promise.all(
    exercises.map((exercise) =>
      titanDatabase.exercisePersonalRecords
        .where('[userId+exercisePlanId]')
        .equals([TITAN_USER_ID, exercise.id])
        .reverse()
        .sortBy('estimatedOneRepMaxKg'),
    ),
  )

  return {
    id: workout.id,
    name: workout.name,
    plannedTime: workout.plannedTime,
    estimatedDurationMinutes: workout.estimatedDurationMinutes,
    status:
      session?.status === 'completed'
        ? 'completed'
        : session?.status === 'started'
          ? 'started'
          : 'planned',
    sessionId: session?.id ?? null,
    startedAt: session?.startedAt ?? null,
    completedAt: session?.completedAt ?? null,
    totalVolumeKg: sets.reduce(
      (total, set) => total + set.loadKg * set.repetitions,
      0,
    ),
    sets: sets
      .sort((a, b) => a.setNumber - b.setNumber)
      .map((set) => ({
        id: set.id,
        exercisePlanId: set.exercisePlanId,
        setNumber: set.setNumber,
        loadKg: set.loadKg,
        repetitions: set.repetitions,
        rir: set.rir,
        estimatedOneRepMaxKg: estimateOneRepMax(
          set.loadKg,
          set.repetitions,
        ),
      })),
    exercises: exercises.map((exercise, index) => {
      const exerciseSets = sets
        .filter((set) => set.exercisePlanId === exercise.id)
        .sort((a, b) => a.setNumber - b.setNumber)

      const bestPr = prs[index].at(-1)

      return {
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
        completedSets: exerciseSets.length,
        bestEstimatedOneRepMaxKg:
          bestPr?.estimatedOneRepMaxKg ?? null,
        progressionSuggestion: getProgressionSuggestion({
          completedSets: exerciseSets.length,
          targetSets: exercise.targetSets,
          repetitions: exerciseSets.map((set) => set.repetitions),
          minReps: exercise.minReps,
          maxReps: exercise.maxReps,
          rirValues: exerciseSets.map((set) => set.rir),
          targetRir: exercise.targetRir,
          lastLoadKg: exerciseSets.at(-1)?.loadKg ?? exercise.previousLoadKg,
        }),
      }
    }),
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

  const [existingSets, exercise] = await Promise.all([
    titanDatabase.exerciseSets
      .where('[workoutSessionId+exercisePlanId]')
      .equals([input.workoutSessionId, input.exercisePlanId])
      .count(),
    titanDatabase.exercisePlans.get(input.exercisePlanId),
  ])

  if (!exercise) throw new Error('Exercício não encontrado.')

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

  const estimatedOneRepMaxKg = estimateOneRepMax(
    input.loadKg,
    input.repetitions,
  )

  const currentBest = await titanDatabase.exercisePersonalRecords
    .where('[userId+exercisePlanId]')
    .equals([TITAN_USER_ID, input.exercisePlanId])
    .reverse()
    .sortBy('estimatedOneRepMaxKg')

  const best = currentBest.at(-1)

  if (
    estimatedOneRepMaxKg > 0 &&
    (!best || estimatedOneRepMaxKg > best.estimatedOneRepMaxKg)
  ) {
    const record: ExercisePersonalRecord = {
      id: `exercise-pr-${crypto.randomUUID()}`,
      userId: TITAN_USER_ID,
      exercisePlanId: input.exercisePlanId,
      exerciseName: exercise.name,
      localDate,
      loadKg: input.loadKg,
      repetitions: input.repetitions,
      estimatedOneRepMaxKg,
      createdAt: now,
      updatedAt: now,
    }

    await titanDatabase.exercisePersonalRecords.add(record)
  }
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
    await titanDatabase.transaction(
      'rw',
      titanDatabase.exerciseSets,
      titanDatabase.exercisePersonalRecords,
      titanDatabase.exercisePlans,
      async () => {
        await titanDatabase.exerciseSets.delete(lastSet.id)
        // Personal records are a cache. Rebuild it from existing sets so a
        // deleted source series can never leave a stale record behind.
        await titanDatabase.exercisePersonalRecords
          .where('[userId+exercisePlanId]')
          .equals([TITAN_USER_ID, exercisePlanId])
          .delete()
        const remaining = await titanDatabase.exerciseSets
          .where('exercisePlanId')
          .equals(exercisePlanId)
          .toArray()
        const best = remaining
          .map((set) => ({ set, value: estimateOneRepMax(set.loadKg, set.repetitions) }))
          .sort((a, b) => b.value - a.value)[0]
        const exercise = await titanDatabase.exercisePlans.get(exercisePlanId)
        if (best && exercise && best.value > 0) {
          const now = new Date().toISOString()
          await titanDatabase.exercisePersonalRecords.add({
            id: `exercise-pr-${crypto.randomUUID()}`, userId: TITAN_USER_ID,
            exercisePlanId, exerciseName: exercise.name, localDate: best.set.localDate,
            loadKg: best.set.loadKg, repetitions: best.set.repetitions,
            estimatedOneRepMaxKg: best.value, createdAt: now, updatedAt: now,
          })
        }
      },
    )
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
