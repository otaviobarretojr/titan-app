import type { ReactNode } from 'react'
import {
  Check,
  Footprints,
  HeartPulse,
  Play,
  RotateCcw,
  Timer,
} from 'lucide-react'
import { Button, Card } from '../../../shared/ui'
import { CardioForm } from '../components/CardioForm'
import { useCardioDay } from '../hooks/useCardioDay'

const cardioLabels = {
  walking: 'Caminhada',
  zone2: 'Zona 2',
  running: 'Corrida',
  hiit: 'HIIT',
}

export function CardioPage() {
  const {
    cardio,
    error,
    isLoading,
    startCardio,
    completeCardio,
    resetCardio,
  } = useCardioDay()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro no cardio</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !cardio) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando cardio...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          TITAN CARDIO
        </p>
        <h1 className="mt-2 text-3xl font-black">{cardio.title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {cardio.plannedTime} · {cardioLabels[cardio.type]}
        </p>
      </header>

      <Card elevated>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon={<Timer size={19} aria-hidden="true" />}
            label="Meta"
            value={`${cardio.targetDurationMinutes} min`}
          />
          <Metric
            icon={<Footprints size={19} aria-hidden="true" />}
            label="Distância"
            value={
              cardio.targetDistanceKm
                ? `${cardio.targetDistanceKm} km`
                : 'Livre'
            }
          />
        </div>

        {cardio.status === 'planned' ? (
          <Button
            className="mt-5"
            fullWidth
            onClick={() => startCardio(cardio.id)}
          >
            <Play size={19} aria-hidden="true" />
            Iniciar cardio
          </Button>
        ) : null}

        {cardio.status === 'completed' ? (
          <div className="mt-5 rounded-2xl bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <Check size={19} aria-hidden="true" />
              <span className="font-bold">Cardio concluído</span>
            </div>

            <p className="mt-3 text-sm text-slate-300">
              {cardio.durationMinutes} min
              {cardio.distanceKm
                ? ` · ${cardio.distanceKm.toLocaleString('pt-BR')} km`
                : ''}
              {cardio.averageHeartRate
                ? ` · ${cardio.averageHeartRate} bpm`
                : ''}
            </p>

            {cardio.sessionId ? (
              <Button
                className="mt-4"
                fullWidth
                onClick={() => resetCardio(cardio.sessionId!)}
                variant="ghost"
              >
                <RotateCcw size={18} aria-hidden="true" />
                Refazer registro
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      {cardio.status === 'started' ? (
        <CardioForm cardio={cardio} onComplete={completeCardio} />
      ) : null}

      <Card>
        <div className="flex gap-3">
          <HeartPulse
            className="shrink-0 text-cyan-300"
            size={22}
            aria-hidden="true"
          />
          <div>
            <h2 className="font-bold">Orientação</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Na Zona 2, mantenha um esforço sustentável e registre a
              frequência cardíaca média quando disponível.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

type MetricProps = {
  icon: ReactNode
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
      <p className="mt-3 text-lg font-black">{value}</p>
    </div>
  )
}
