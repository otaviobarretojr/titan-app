import { Moon, RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import { useSleep } from '../hooks/useSleep'

export function SleepPage() {
  const { sleep, error, isLoading, saveSleep, clearSleep } = useSleep()

  const initialDurationMinutes = sleep?.durationMinutes ?? 450

  const [hours, setHours] = useState(() =>
    Math.floor(initialDurationMinutes / 60),
  )

  const [minutes, setMinutes] = useState(
    () => initialDurationMinutes % 60,
  )

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">
          Erro no registro de sono
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {error}
        </p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando sono...
        </p>
      </div>
    )
  }

  const durationMinutes = hours * 60 + minutes

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">
          TITAN RECUPERAÇÃO
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Sono
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre a duração real do sono para alimentar o Coach
          e o Score TITAN.
        </p>
      </header>

      <Card elevated>
        <div className="flex items-center gap-3 text-indigo-300">
          <Moon size={24} aria-hidden="true" />

          <h2 className="text-lg font-bold">
            Sono de hoje
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <NumberField
            label="Horas"
            value={hours}
            min={0}
            max={23}
            onChange={setHours}
          />

          <NumberField
            label="Minutos"
            value={minutes}
            min={0}
            max={59}
            onChange={setMinutes}
          />
        </div>

        <p className="mt-4 text-center text-3xl font-black">
          {hours}h{minutes.toString().padStart(2, '0')}
        </p>

        <Button
          className="mt-5"
          fullWidth
          onClick={() => saveSleep(durationMinutes)}
        >
          <Save size={18} aria-hidden="true" />
          Salvar sono
        </Button>

        {sleep ? (
          <Button
            className="mt-3"
            fullWidth
            onClick={clearSleep}
            variant="ghost"
          >
            <RotateCcw size={18} aria-hidden="true" />
            Limpar registro
          </Button>
        ) : null}
      </Card>
    </div>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: NumberFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>

      <input
        className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-xl font-black text-white outline-none focus:border-indigo-400"
        max={max}
        min={min}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
        type="number"
        value={value}
      />
    </label>
  )
}