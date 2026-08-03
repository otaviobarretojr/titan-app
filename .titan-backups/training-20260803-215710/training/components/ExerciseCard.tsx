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
