import type { ReactNode } from 'react'
import {
  Check,
  Footprints,
  HeartPulse,
  Play,
  RotateCcw,
  Timer,
} from 'lucide-react'
import { Button, Card, SectionTitle } from '../../../shared/ui'
import { CardioForm } from '../components/CardioForm'
import { CardioHistory } from '../components/CardioHistory'
import { useCardioDay } from '../hooks/useCardioDay'
import { useCardioHistory } from '../hooks/useCardioHistory'
import { formatPace } from '../utils/cardioMath'

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

  const { history } = useCardioHistory()
  const recent = history.slice(0, 7)
  const previous = history.slice(7, 14)
  const recentMinutes = recent.reduce((total, item) => total + item.durationMinutes, 0)
  const previousMinutes = previous.reduce((total, item) => total + item.durationMinutes, 0)
  const weeklyChange = previousMinutes ? Math.round((recentMinutes - previousMinutes) / previousMinutes * 100) : recentMinutes ? 100 : 0
  const avgPace = recent.find((item) => item.paceMinutesPerKm !== null)?.paceMinutesPerKm ?? null
  const weeklyDistance = recent.reduce((total, item) => total + (item.distanceKm ?? 0), 0)

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

        <h1 className="mt-2 text-3xl font-black">
          {cardio.title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {cardio.plannedTime} · {cardioLabels[cardio.type]}
        </p>
      </header>

      <Card elevated>
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-cyan-500/15 to-blue-500/5 p-4">
          <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Zona cardíaca</span><span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-black text-cyan-200">{cardio.type === 'zone2' ? 'ZONA 2 · AERÓBICA' : cardioLabels[cardio.type].toUpperCase()}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-500"><div className="ml-[28%] h-full w-1 rounded-full bg-white shadow"/></div>
        </div>
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
              <span className="font-bold">
                Cardio concluído
              </span>
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

            <p className="mt-2 text-sm text-slate-400">
              Pace: {formatPace(cardio.paceMinutesPerKm)} · Esforço{' '}
              {cardio.perceivedEffort}/10
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

      <Card>
        <h2 className="font-bold">Evolução semanal</h2>
        <div className="mt-4 grid grid-cols-3 gap-2"><Metric icon={<Timer size={18}/>} label="7 dias" value={`${recentMinutes} min`} /><Metric icon={<Footprints size={18}/>} label="Distância" value={`${weeklyDistance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`} /><Metric icon={<HeartPulse size={18}/>} label="Ritmo médio" value={formatPace(avgPace)} /></div>
        <p className={`mt-4 text-sm font-bold ${weeklyChange >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>{weeklyChange >= 0 ? '+' : ''}{weeklyChange}% versus semana anterior</p>
      </Card>

      {cardio.status === 'started' ? (
        <CardioForm
          cardio={cardio}
          onComplete={completeCardio}
        />
      ) : null}

      <section>
        <SectionTitle
          title="Histórico"
          supportingText={`${history.length} sessões`}
        />

        <CardioHistory history={history} />
      </section>

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
              Na Zona 2, mantenha um esforço sustentável. Em corrida,
              compare pace, duração e esforço ao longo das semanas.
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

function Metric({
  icon,
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs font-bold">
          {label}
        </span>
      </div>

      <p className="mt-3 text-lg font-black">
        {value}
      </p>
    </div>
  )
}
