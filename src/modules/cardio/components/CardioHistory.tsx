import type { ReactNode } from 'react'
import { Activity, HeartPulse, Timer } from 'lucide-react'
import { Card } from '../../../shared/ui'
import type { CardioHistoryItem } from '../types/cardio'
import { formatPace } from '../utils/cardioMath'

type CardioHistoryProps = {
  history: CardioHistoryItem[]
}

export function CardioHistory({ history }: CardioHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhuma sessão concluída ainda.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <Card key={item.id}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            {new Intl.DateTimeFormat('pt-BR').format(
              new Date(`${item.localDate}T12:00:00`),
            )}
          </p>

          <h3 className="mt-2 text-lg font-bold">{item.title}</h3>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric
              icon={<Timer size={16} aria-hidden="true" />}
              value={`${item.durationMinutes} min`}
            />
            <Metric
              icon={<Activity size={16} aria-hidden="true" />}
              value={
                item.distanceKm
                  ? `${item.distanceKm.toLocaleString('pt-BR')} km`
                  : '—'
              }
            />
            <Metric
              icon={<HeartPulse size={16} aria-hidden="true" />}
              value={
                item.averageHeartRate
                  ? `${item.averageHeartRate} bpm`
                  : '—'
              }
            />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Pace: {formatPace(item.paceMinutesPerKm)} · Esforço{' '}
            {item.perceivedEffort}/10
          </p>
        </Card>
      ))}
    </div>
  )
}

type MetricProps = {
  icon: ReactNode
  value: string
}

function Metric({ icon, value }: MetricProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs">
      <span className="text-slate-500">{icon}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
