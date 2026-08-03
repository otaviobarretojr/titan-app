import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { CardioDay } from '../types/cardio'

type CardioFormProps = {
  cardio: CardioDay
  onComplete: (input: {
    sessionId: string
    durationMinutes: number
    distanceKm: number | null
    averageHeartRate: number | null
    perceivedEffort: number
    notes: string
  }) => Promise<unknown>
}

export function CardioForm({
  cardio,
  onComplete,
}: CardioFormProps) {
  const [durationMinutes, setDurationMinutes] = useState(
    cardio.targetDurationMinutes,
  )
  const [distanceKm, setDistanceKm] = useState(
    cardio.targetDistanceKm ?? 0,
  )
  const [averageHeartRate, setAverageHeartRate] = useState(0)
  const [perceivedEffort, setPerceivedEffort] = useState(5)
  const [notes, setNotes] = useState('')

  if (!cardio.sessionId) return null

  return (
    <Card>
      <h2 className="text-lg font-bold">Registrar resultado</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <NumberField
          label="Duração"
          suffix="min"
          value={durationMinutes}
          onChange={setDurationMinutes}
          min={1}
          step={1}
        />

        <NumberField
          label="Distância"
          suffix="km"
          value={distanceKm}
          onChange={setDistanceKm}
          min={0}
          step={0.1}
        />

        <NumberField
          label="FC média"
          suffix="bpm"
          value={averageHeartRate}
          onChange={setAverageHeartRate}
          min={0}
          step={1}
        />

        <NumberField
          label="Esforço"
          suffix="/10"
          value={perceivedEffort}
          onChange={setPerceivedEffort}
          min={1}
          max={10}
          step={1}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Observações
        </span>
        <textarea
          className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-blue-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ritmo, desconfortos, sensação geral..."
          value={notes}
        />
      </label>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onComplete({
            sessionId: cardio.sessionId!,
            durationMinutes,
            distanceKm: distanceKm > 0 ? distanceKm : null,
            averageHeartRate:
              averageHeartRate > 0 ? averageHeartRate : null,
            perceivedEffort,
            notes,
          })
        }
        variant="secondary"
      >
        <Check size={19} aria-hidden="true" />
        Finalizar cardio
      </Button>
    </Card>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max?: number
  step: number
  suffix: string
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: NumberFieldProps) {
  return (
    <label>
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
        <span className="text-xs font-bold text-slate-500">{suffix}</span>
      </div>
    </label>
  )
}
