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
  isCurrent: boolean
}

export function ExerciseCard({
  exercise,
  sets,
  sessionId,
  onAddSet,
  onRemoveLastSet,
  onStartRest,
  isCurrent,
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
    <Card className={isCurrent ? 'border-violet-400/50 shadow-lg shadow-violet-500/10' : ''}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
            {isCurrent ? 'AGORA · ' : ''}{exercise.muscleGroup}
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
              className="set-complete grid grid-cols-4 gap-2 border-b border-white/5 px-3 py-2 text-center text-xs last:border-b-0"
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
