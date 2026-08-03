#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Feature Treino Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/training-$STAMP"
mkdir -p "$BACKUP_DIR" docs/features src/modules/training/{components,data,hooks,pages,types,utils}

for item in src/modules/training src/database/titanDatabase.ts src/database/seeds/seedToday.ts docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

python3 - <<'PY'
from pathlib import Path

path = Path("src/database/titanDatabase.ts")
content = path.read_text()

insert = """
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

"""

marker = "export type HydrationEntryRecord = {"
if "export type ExercisePersonalRecord" not in content:
    content = content.replace(marker, insert + marker)

class_marker = "  hydrationEntries!: EntityTable<HydrationEntryRecord, 'id'>"
if "exercisePersonalRecords!: EntityTable" not in content:
    content = content.replace(
        class_marker,
        "  exercisePersonalRecords!: EntityTable<ExercisePersonalRecord, 'id'>\n" + class_marker,
    )

version5 = """
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
"""

end = "\n  }\n}\n\nexport const titanDatabase"
if "this.version(5)" not in content:
    content = content.replace(end, version5 + end)

path.write_text(content)
PY

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
  bestEstimatedOneRepMaxKg: number | null
  progressionSuggestion: string
}

export type TrainingSet = {
  id: string
  exercisePlanId: string
  setNumber: number
  loadKg: number
  repetitions: number
  rir: number
  estimatedOneRepMaxKg: number
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
  sets: TrainingSet[]
  totalVolumeKg: number
}
EOF

cat > src/modules/training/utils/trainingMath.ts <<'EOF'
export function estimateOneRepMax(loadKg: number, repetitions: number) {
  if (loadKg <= 0 || repetitions <= 0) return 0
  return loadKg * (1 + repetitions / 30)
}

export function getProgressionSuggestion(input: {
  completedSets: number
  targetSets: number
  repetitions: number[]
  minReps: number
  maxReps: number
  rirValues: number[]
  targetRir: number
  lastLoadKg: number | null
}) {
  if (input.completedSets < input.targetSets) {
    return 'Complete todas as séries antes de progredir.'
  }

  const allAtTopRange =
    input.repetitions.length > 0 &&
    input.repetitions.every((value) => value >= input.maxReps)

  const effortControlled =
    input.rirValues.length > 0 &&
    input.rirValues.every((value) => value >= input.targetRir)

  if (allAtTopRange && effortControlled) {
    if (input.lastLoadKg === null || input.lastLoadKg <= 0) {
      return 'Defina uma carga base na próxima sessão.'
    }

    const suggestedIncrease =
      input.lastLoadKg < 20 ? 1 : input.lastLoadKg < 60 ? 2.5 : 5

    return `Sugestão: aumentar para ${(
      input.lastLoadKg + suggestedIncrease
    ).toLocaleString('pt-BR')} kg.`
  }

  const belowMinimum = input.repetitions.some(
    (value) => value < input.minReps,
  )

  if (belowMinimum) {
    return 'Mantenha ou reduza a carga até atingir a faixa mínima.'
  }

  return 'Mantenha a carga e busque mais repetições com boa técnica.'
}
EOF

cat > src/modules/training/data/trainingRepository.ts <<'EOF'
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

cat > src/modules/training/hooks/useRestTimer.ts <<'EOF'
import { useEffect, useState } from 'react'

export function useRestTimer() {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) return

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setIsRunning(false)

          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
          }

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, secondsRemaining])

  return {
    secondsRemaining,
    isRunning,
    start: (seconds: number) => {
      setSecondsRemaining(seconds)
      setIsRunning(true)
    },
    pause: () => setIsRunning(false),
    resume: () => {
      if (secondsRemaining > 0) setIsRunning(true)
    },
    reset: () => {
      setSecondsRemaining(0)
      setIsRunning(false)
    },
  }
}
EOF

cat > src/modules/training/components/RestTimer.tsx <<'EOF'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'

type RestTimerProps = {
  secondsRemaining: number
  isRunning: boolean
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function RestTimer({
  secondsRemaining,
  isRunning,
  onPause,
  onResume,
  onReset,
}: RestTimerProps) {
  if (secondsRemaining <= 0) return null

  return (
    <Card className="sticky top-4 z-30 border-violet-500/30 bg-[#171124] shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300">
            <Timer size={18} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Descanso
            </span>
          </div>
          <p className="mt-2 text-4xl font-black">
            {formatTime(secondsRemaining)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            aria-label={isRunning ? 'Pausar descanso' : 'Continuar descanso'}
            onClick={isRunning ? onPause : onResume}
            variant="ghost"
          >
            {isRunning ? (
              <Pause size={19} aria-hidden="true" />
            ) : (
              <Play size={19} aria-hidden="true" />
            )}
          </Button>

          <Button
            aria-label="Encerrar descanso"
            onClick={onReset}
            variant="ghost"
          >
            <RotateCcw size={19} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
EOF

cat > src/modules/training/components/ExerciseCard.tsx <<'EOF'
import { Minus, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type {
  TrainingExercise,
  TrainingSet,
} from '../types/training'

type ExerciseCardProps = {
  exercise: TrainingExercise
  sets: TrainingSet[]
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
  onStartRest: (seconds: number) => void
}

export function ExerciseCard({
  exercise,
  sets,
  sessionId,
  onAddSet,
  onRemoveLastSet,
  onStartRest,
}: ExerciseCardProps) {
  const lastSet = sets.at(-1)
  const [loadKg, setLoadKg] = useState(
    lastSet?.loadKg ?? exercise.previousLoadKg ?? 0,
  )
  const [repetitions, setRepetitions] = useState(
    lastSet?.repetitions ?? exercise.minReps,
  )
  const [rir, setRir] = useState(lastSet?.rir ?? exercise.targetRir)

  async function registerSet() {
    await onAddSet({
      workoutSessionId: sessionId,
      exercisePlanId: exercise.id,
      loadKg,
      repetitions,
      rir,
    })

    onStartRest(exercise.restSeconds)
  }

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
            {exercise.maxReps} reps · RIR {exercise.targetRir} · descanso{' '}
            {exercise.restSeconds}s
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 px-3 py-2 text-center">
          <p className="text-xl font-black">{exercise.completedSets}</p>
          <p className="text-[10px] font-bold uppercase text-slate-500">
            séries
          </p>
        </div>
      </div>

      {exercise.bestEstimatedOneRepMaxKg !== null ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-500/10 p-3 text-amber-300">
          <Trophy size={17} aria-hidden="true" />
          <span className="text-xs font-bold">
            Melhor 1RM estimado:{' '}
            {exercise.bestEstimatedOneRepMaxKg.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })}{' '}
            kg
          </span>
        </div>
      ) : null}

      {sets.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          {sets.map((set) => (
            <div
              className="grid grid-cols-4 gap-2 border-b border-white/5 px-3 py-2 text-center text-xs last:border-b-0"
              key={set.id}
            >
              <span className="font-bold text-slate-500">
                S{set.setNumber}
              </span>
              <span>{set.loadKg} kg</span>
              <span>{set.repetitions} reps</span>
              <span>RIR {set.rir}</span>
            </div>
          ))}
        </div>
      ) : null}

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
        <Button fullWidth onClick={registerSet}>
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

      <p className="mt-4 rounded-2xl bg-white/5 p-3 text-xs leading-5 text-slate-400">
        {exercise.progressionSuggestion}
      </p>
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
import { Check, Dumbbell, Gauge, Play } from 'lucide-react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import { ExerciseCard } from '../components/ExerciseCard'
import { RestTimer } from '../components/RestTimer'
import { useRestTimer } from '../hooks/useRestTimer'
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

  const restTimer = useRestTimer()

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

      <RestTimer
        isRunning={restTimer.isRunning}
        onPause={restTimer.pause}
        onReset={restTimer.reset}
        onResume={restTimer.resume}
        secondsRemaining={restTimer.secondsRemaining}
      />

      <Card elevated>
        <ProgressBar
          label={`${completedSets} de ${targetSets} séries registradas`}
          value={progress}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric
            icon={<Gauge size={18} aria-hidden="true" />}
            label="Volume"
            value={`${workout.totalVolumeKg.toLocaleString('pt-BR')} kg`}
          />
          <Metric
            icon={<Dumbbell size={18} aria-hidden="true" />}
            label="Exercícios"
            value={`${workout.exercises.length}`}
          />
        </div>

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
              Inicie o treino para liberar séries, descanso, volume e recordes.
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
              sets={workout.sets.filter(
                (set) => set.exercisePlanId === exercise.id,
              )}
              onAddSet={addExerciseSet}
              onRemoveLastSet={removeLastExerciseSet}
              onStartRest={restTimer.start}
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

type MetricProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("src/modules/training/pages/TrainingPage.tsx")
content = path.read_text()
content = content.replace(
    "import { Check, Dumbbell, Gauge, Play } from 'lucide-react'",
    """import type { ReactNode } from 'react'
import { Check, Dumbbell, Gauge, Play } from 'lucide-react'""",
)
content = content.replace("React.ReactNode", "ReactNode")
path.write_text(content)
PY

cat > docs/features/TRAINING_PREMIUM.md <<'EOF'
# Feature Treino Premium

## Incluído

- Registro série por série.
- Carga, repetições e RIR.
- Cronômetro de descanso.
- Vibração ao terminar descanso.
- Volume total do treino.
- Histórico visível dentro do exercício.
- Recorde pessoal por 1RM estimado.
- Sugestão automática de progressão.
- Persistência IndexedDB.
- Atualização automática do Dashboard e Score.

## Critérios de aceite

- Registrar uma série inicia o descanso recomendado.
- Remover a última série atualiza volume e progresso.
- Um novo recorde é salvo somente quando supera o anterior.
- Progressão exige séries completas, topo da faixa e RIR controlado.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Feature Treino Premium

### Added

- Cronômetro de descanso.
- Volume total.
- Recordes pessoais.
- 1RM estimado.
- Sugestão automática de progressão.
- Histórico de séries por exercício.
- Schema 5 do IndexedDB.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Feature Treino Premium aplicada."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver premium training flow"'
echo 'git push'
