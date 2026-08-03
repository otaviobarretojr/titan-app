import { Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'

type HealthMetricFormProps = {
  onSave: (input: {
    systolicPressure: number | null
    diastolicPressure: number | null
    restingHeartRate: number | null
    symptom: string
    notes: string
  }) => Promise<unknown>
}

export function HealthMetricForm({
  onSave,
}: HealthMetricFormProps) {
  const [systolicPressure, setSystolicPressure] = useState(0)
  const [diastolicPressure, setDiastolicPressure] = useState(0)
  const [restingHeartRate, setRestingHeartRate] = useState(0)
  const [symptom, setSymptom] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <Card>
      <h2 className="text-lg font-bold">Registro de saúde</h2>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <NumberField
          label="Sistólica"
          suffix="mmHg"
          value={systolicPressure}
          onChange={setSystolicPressure}
        />
        <NumberField
          label="Diastólica"
          suffix="mmHg"
          value={diastolicPressure}
          onChange={setDiastolicPressure}
        />
        <NumberField
          label="FC repouso"
          suffix="bpm"
          value={restingHeartRate}
          onChange={setRestingHeartRate}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Sintoma
        </span>
        <input
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
          onChange={(event) => setSymptom(event.target.value)}
          placeholder="Ex.: dor de cabeça, tontura, nenhum"
          value={symptom}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Observações
        </span>
        <textarea
          className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-blue-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Contexto da medição..."
          value={notes}
        />
      </label>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onSave({
            systolicPressure:
              systolicPressure > 0 ? systolicPressure : null,
            diastolicPressure:
              diastolicPressure > 0 ? diastolicPressure : null,
            restingHeartRate:
              restingHeartRate > 0 ? restingHeartRate : null,
            symptom,
            notes,
          })
        }
      >
        <Save size={18} aria-hidden="true" />
        Salvar registro
      </Button>
    </Card>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  suffix: string
  onChange: (value: number) => void
}

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: NumberFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-[11px] font-bold text-slate-500">
        {label}
      </span>
      <div className="rounded-2xl bg-white/5 p-2">
        <input
          className="min-h-10 w-full bg-transparent text-center font-black text-white outline-none"
          min={0}
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          value={value}
        />
        <span className="block text-center text-[10px] text-slate-600">
          {suffix}
        </span>
      </div>
    </label>
  )
}
