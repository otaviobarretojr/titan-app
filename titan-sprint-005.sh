#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 005: Training Module"

mkdir -p \
  docs/sprints \
  src/modules/training/components \
  src/modules/training/data \
  src/modules/training/hooks \
  src/modules/training/pages \
  src/modules/training/types

cat > src/database/titanDatabase.ts <<'EOF'
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
  status: 'started' | 'completed' | 'cancelled'
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
  }
}

export const titanDatabase = new TitanDatabase()
EOF

cat > src/database/seeds/seedToday.ts <<'EOF'
import { getTitanLocalDate } from '../date'
import { titanDatabase } from '../titanDatabase'

const USER_ID = 'otavio'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function seedToday() {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  await titanDatabase.transaction(
    'rw',
    [
      titanDatabase.users,
      titanDatabase.dailyPlans,
      titanDatabase.mealPlans,
      titanDatabase.workoutPlans,
      titanDatabase.exercisePlans,
      titanDatabase.coachRecommendations,
    ],
    async () => {
      const user = await titanDatabase.users.get(USER_ID)

      if (!user) {
        await titanDatabase.users.add({
          id: USER_ID,
          displayName: 'Otávio',
          createdAt: now,
          updatedAt: now,
        })
      }

      const dailyPlan = await titanDatabase.dailyPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!dailyPlan) {
        await titanDatabase.dailyPlans.add({
          id: createId('daily-plan'),
          userId: USER_ID,
          localDate,
          calorieTargetKcal: 3624,
          proteinTargetG: 220,
          hydrationTargetMl: 4500,
          sleepTargetMinutes: 450,
          createdAt: now,
          updatedAt: now,
        })
      }

      const mealCount = await titanDatabase.mealPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .count()

      if (mealCount === 0) {
        await titanDatabase.mealPlans.bulkAdd([
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Café da manhã',
            plannedTime: '06:15',
            sequence: 1,
            caloriesKcal: 650,
            proteinG: 45,
            carbohydrateG: 65,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Lanche da manhã',
            plannedTime: '09:30',
            sequence: 2,
            caloriesKcal: 430,
            proteinG: 32,
            carbohydrateG: 42,
            fatG: 14,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Almoço',
            plannedTime: '12:30',
            sequence: 3,
            caloriesKcal: 850,
            proteinG: 55,
            carbohydrateG: 95,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Pré-treino',
            plannedTime: '16:15',
            sequence: 4,
            caloriesKcal: 520,
            proteinG: 34,
            carbohydrateG: 70,
            fatG: 12,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Jantar pós-treino',
            plannedTime: '20:15',
            sequence: 5,
            caloriesKcal: 820,
            proteinG: 58,
            carbohydrateG: 88,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Ceia',
            plannedTime: '21:30',
            sequence: 6,
            caloriesKcal: 354,
            proteinG: 26,
            carbohydrateG: 28,
            fatG: 14,
            createdAt: now,
            updatedAt: now,
          },
        ])
      }

      let workout = await titanDatabase.workoutPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!workout) {
        const workoutPlanId = createId('workout')

        workout = {
          id: workoutPlanId,
          userId: USER_ID,
          localDate,
          name: 'Peito e tríceps',
          plannedTime: '19:00',
          exerciseCount: 7,
          estimatedDurationMinutes: 60,
          createdAt: now,
          updatedAt: now,
        }

        await titanDatabase.workoutPlans.add(workout)
      }

      const exerciseCount = await titanDatabase.exercisePlans
        .where('workoutPlanId')
        .equals(workout.id)
        .count()

      if (exerciseCount === 0) {
        await titanDatabase.exercisePlans.bulkAdd([
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Supino reto',
            muscleGroup: 'Peito',
            sequence: 1,
            targetSets: 4,
            minReps: 6,
            maxReps: 10,
            targetRir: 2,
            restSeconds: 120,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Supino inclinado com halteres',
            muscleGroup: 'Peito',
            sequence: 2,
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            targetRir: 2,
            restSeconds: 90,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Crucifixo na máquina',
            muscleGroup: 'Peito',
            sequence: 3,
            targetSets: 3,
            minReps: 10,
            maxReps: 15,
            targetRir: 1,
            restSeconds: 75,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Crossover',
            muscleGroup: 'Peito',
            sequence: 4,
            targetSets: 3,
            minReps: 12,
            maxReps: 15,
            targetRir: 1,
            restSeconds: 60,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Tríceps testa',
            muscleGroup: 'Tríceps',
            sequence: 5,
            targetSets: 3,
            minReps: 8,
            maxReps: 12,
            targetRir: 2,
            restSeconds: 75,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Tríceps corda',
            muscleGroup: 'Tríceps',
            sequence: 6,
            targetSets: 3,
            minReps: 10,
            maxReps: 15,
            targetRir: 1,
            restSeconds: 60,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('exercise'),
            userId: USER_ID,
            workoutPlanId: workout.id,
            localDate,
            name: 'Tríceps unilateral',
            muscleGroup: 'Tríceps',
            sequence: 7,
            targetSets: 3,
            minReps: 10,
            maxReps: 15,
            targetRir: 1,
            restSeconds: 60,
            previousLoadKg: null,
            createdAt: now,
            updatedAt: now,
          },
        ])
      }

      const recommendation = await titanDatabase.coachRecommendations
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!recommendation) {
        await titanDatabase.coachRecommendations.add({
          id: createId('coach'),
          userId: USER_ID,
          localDate,
          title: 'Prioridade de hoje',
          message:
            'Registre o que realmente consumir e distribua a hidratação até o treino.',
          priority: 'high',
          createdAt: now,
          updatedAt: now,
        })
      }
    },
  )
}

export const TITAN_USER_ID = USER_ID
EOF

cat > src/modules/training/types/training.ts <<'EOF'
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
EOF

cat > src/modules/training/data/trainingRepository.ts <<'EOF'
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
EOF

cat > src/modules/training/hooks/useTrainingWorkout.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { seedToday } from '../../../database/seeds/seedToday'
import {
  addExerciseSet,
  finishWorkout,
  getTrainingWorkout,
  removeLastExerciseSet,
  startWorkout,
} from '../data/trainingRepository'

export function useTrainingWorkout() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seedToday()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar o treino.',
        )
      })
  }, [])

  const workout = useLiveQuery(
    () => (isReady ? getTrainingWorkout() : null),
    [isReady],
    null,
  )

  async function runAction(action: () => Promise<unknown>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar o treino.',
      )
    }
  }

  return {
    workout,
    error,
    isLoading:
      !error && (!isReady || workout === undefined || workout === null),
    startWorkout: (workoutPlanId: string) =>
      runAction(() => startWorkout(workoutPlanId)),
    addExerciseSet: (input: {
      workoutSessionId: string
      exercisePlanId: string
      loadKg: number
      repetitions: number
      rir: number
    }) => runAction(() => addExerciseSet(input)),
    removeLastExerciseSet: (
      workoutSessionId: string,
      exercisePlanId: string,
    ) =>
      runAction(() =>
        removeLastExerciseSet(workoutSessionId, exercisePlanId),
      ),
    finishWorkout: (workoutSessionId: string) =>
      runAction(() => finishWorkout(workoutSessionId)),
  }
}
EOF

cat > src/modules/training/components/ExerciseCard.tsx <<'EOF'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { TrainingExercise } from '../types/training'

type ExerciseCardProps = {
  exercise: TrainingExercise
  sessionId: string
  onAddSet: (input: {
    workoutSessionId: string
    exercisePlanId: string
    loadKg: number
    repetitions: number
    rir: number
  }) => Promise<unknown>
  onRemoveLastSet: (
    workoutSessionId: string,
    exercisePlanId: string,
  ) => Promise<unknown>
}

export function ExerciseCard({
  exercise,
  sessionId,
  onAddSet,
  onRemoveLastSet,
}: ExerciseCardProps) {
  const [loadKg, setLoadKg] = useState(exercise.previousLoadKg ?? 0)
  const [repetitions, setRepetitions] = useState(exercise.minReps)
  const [rir, setRir] = useState(exercise.targetRir)

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
            {exercise.muscleGroup}
          </p>
          <h2 className="mt-2 text-lg font-bold">{exercise.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {exercise.targetSets} séries · {exercise.minReps}–
            {exercise.maxReps} repetições · RIR {exercise.targetRir}
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 px-3 py-2 text-center">
          <p className="text-xl font-black">{exercise.completedSets}</p>
          <p className="text-[10px] font-bold uppercase text-slate-500">
            séries
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <NumberField
          label="Carga"
          suffix="kg"
          value={loadKg}
          onChange={setLoadKg}
          step={2.5}
          min={0}
        />
        <NumberField
          label="Reps"
          value={repetitions}
          onChange={setRepetitions}
          step={1}
          min={1}
        />
        <NumberField
          label="RIR"
          value={rir}
          onChange={setRir}
          step={1}
          min={0}
          max={10}
        />
      </div>

      <div className="mt-5 flex gap-3">
        <Button
          fullWidth
          onClick={() =>
            onAddSet({
              workoutSessionId: sessionId,
              exercisePlanId: exercise.id,
              loadKg,
              repetitions,
              rir,
            })
          }
        >
          <Plus size={18} aria-hidden="true" />
          Registrar série
        </Button>

        {exercise.completedSets > 0 ? (
          <Button
            aria-label={`Remover última série de ${exercise.name}`}
            onClick={() => onRemoveLastSet(sessionId, exercise.id)}
            variant="ghost"
          >
            <Minus size={18} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  step: number
  min: number
  max?: number
  suffix?: string
}

function NumberField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  suffix,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>
      <div className="flex items-center rounded-2xl bg-white/5 px-3">
        <input
          className="min-h-12 min-w-0 flex-1 border-0 bg-transparent text-center font-black text-white outline-none"
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step}
          type="number"
          value={value}
        />
        {suffix ? (
          <span className="text-xs font-bold text-slate-500">{suffix}</span>
        ) : null}
      </div>
    </label>
  )
}
EOF

cat > src/modules/training/pages/TrainingPage.tsx <<'EOF'
import { Check, Dumbbell, Play } from 'lucide-react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import { ExerciseCard } from '../components/ExerciseCard'
import { useTrainingWorkout } from '../hooks/useTrainingWorkout'

export function TrainingPage() {
  const {
    workout,
    error,
    isLoading,
    startWorkout,
    addExerciseSet,
    removeLastExerciseSet,
    finishWorkout,
  } = useTrainingWorkout()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro no treino</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !workout) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando treino...
        </p>
      </div>
    )
  }

  const completedSets = workout.exercises.reduce(
    (total, exercise) => total + exercise.completedSets,
    0,
  )
  const targetSets = workout.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  )
  const progress =
    targetSets > 0 ? Math.round((completedSets / targetSets) * 100) : 0

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-violet-300">
          TITAN TREINO
        </p>
        <h1 className="mt-2 text-3xl font-black">{workout.name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {workout.plannedTime} · aproximadamente{' '}
          {workout.estimatedDurationMinutes} minutos
        </p>
      </header>

      <Card elevated>
        <ProgressBar
          label={`${completedSets} de ${targetSets} séries registradas`}
          value={progress}
        />

        {workout.status === 'planned' ? (
          <Button
            className="mt-5"
            fullWidth
            onClick={() => startWorkout(workout.id)}
          >
            <Play size={19} aria-hidden="true" />
            Iniciar treino
          </Button>
        ) : null}

        {workout.status === 'completed' ? (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-4 text-emerald-300">
            <Check size={19} aria-hidden="true" />
            <span className="font-bold">Treino concluído</span>
          </div>
        ) : null}
      </Card>

      {workout.status === 'planned' ? (
        <Card>
          <div className="flex gap-3">
            <Dumbbell
              className="shrink-0 text-violet-300"
              size={22}
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-slate-400">
              Inicie o treino para liberar o registro das séries.
            </p>
          </div>
        </Card>
      ) : null}

      {workout.status !== 'planned' && workout.sessionId ? (
        <section className="space-y-3">
          {workout.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sessionId={workout.sessionId!}
              onAddSet={addExerciseSet}
              onRemoveLastSet={removeLastExerciseSet}
            />
          ))}
        </section>
      ) : null}

      {workout.status === 'started' && workout.sessionId ? (
        <Button
          fullWidth
          onClick={() => finishWorkout(workout.sessionId!)}
          variant="secondary"
        >
          <Check size={19} aria-hidden="true" />
          Finalizar treino
        </Button>
      ) : null}
    </div>
  )
}
EOF

python3 - <<'EOF'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

content = content.replace(
    "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
    """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { TrainingPage } from '../modules/training/pages/TrainingPage'"""
)

old_route = """          <Route
            path="/training"
            element={
              <ModulePlaceholderPage
                eyebrow="Módulo de treino"
                title="Treinos"
                description="Execução de exercícios, séries, cargas e progressão será implementada na versão v0.3."
              />
            }
          />"""

new_route = """          <Route path="/training" element={<TrainingPage />} />"""

if old_route not in content:
    raise SystemExit("Rota provisória de treino não encontrada em App.tsx.")

content = content.replace(old_route, new_route)
path.write_text(content)
EOF

cat > docs/sprints/SPRINT-005.md <<'EOF'
# Sprint 005 — Módulo Treino

## Objetivo

Permitir iniciar o treino, registrar séries individualmente e finalizar a sessão.

## Entregas

- Migração do banco para schema 2.
- Exercícios planejados.
- Sessão de treino persistente.
- Registro de carga, repetições e RIR.
- Remoção da última série.
- Progresso de séries.
- Finalização do treino.
- Persistência após recarregar a página.

## Critérios de aceite

- O treino só registra séries após ser iniciado.
- Cada série possui carga, repetições e RIR.
- Dados persistem no IndexedDB.
- Build e lint passam sem erros.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 005

### Added

- Módulo de treino.
- Sessões de treino persistentes.
- Registro individual de séries.
- Carga, repetições e RIR.
- Progresso e conclusão do treino.
- Schema 2 do IndexedDB.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 005 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: implement workout session tracking" && git push'
