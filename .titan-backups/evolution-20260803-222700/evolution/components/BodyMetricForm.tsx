import { Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'

type BodyMetricFormProps = {
  onSave: (input: {
    weightKg: number
    waistCm: number | null
    armCm: number | null
    chestCm: number | null
    thighCm: number | null
    calfCm: number | null
    bodyFatPercentage: number | null
    notes: string
  }) => Promise<unknown>
}

export function BodyMetricForm({ onSave }: BodyMetricFormProps) {
  const [weightKg, setWeightKg] = useState(92)
  const [waistCm, setWaistCm] = useState(0)
  const [armCm, setArmCm] = useState(0)
  const [chestCm, setChestCm] = useState(0)
  const [thighCm, setThighCm] = useState(0)
  const [calfCm, setCalfCm] = useState(0)
  const [bodyFatPercentage, setBodyFatPercentage] = useState(0)
  const [notes, setNotes] = useState('')

  return (
    <Card>
      <h2 className="text-lg font-bold">Registrar medidas</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <NumberField
          label="Peso"
          suffix="kg"
          value={weightKg}
          onChange={setWeightKg}
          min={1}
          step={0.1}
        />
        <NumberField
          label="Cintura"
          suffix="cm"
          value={waistCm}
          onChange={setWaistCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Braço"
          suffix="cm"
          value={armCm}
          onChange={setArmCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Peito"
          suffix="cm"
          value={chestCm}
          onChange={setChestCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Coxa"
          suffix="cm"
          value={thighCm}
          onChange={setThighCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Panturrilha"
          suffix="cm"
          value={calfCm}
          onChange={setCalfCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Gordura"
          suffix="%"
          value={bodyFatPercentage}
          onChange={setBodyFatPercentage}
          min={0}
          max={100}
          step={0.1}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Observações
        </span>
        <textarea
          className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-blue-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Condição da medição, retenção, horário..."
          value={notes}
        />
      </label>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onSave({
            weightKg,
            waistCm: waistCm > 0 ? waistCm : null,
            armCm: armCm > 0 ? armCm : null,
            chestCm: chestCm > 0 ? chestCm : null,
            thighCm: thighCm > 0 ? thighCm : null,
            calfCm: calfCm > 0 ? calfCm : null,
            bodyFatPercentage:
              bodyFatPercentage > 0 ? bodyFatPercentage : null,
            notes,
          })
        }
      >
        <Save size={18} aria-hidden="true" />
        Salvar medição
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
