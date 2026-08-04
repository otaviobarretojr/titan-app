import { HeartPulse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card, ProgressBar } from '../../../shared/ui'
import type { DashboardCardio } from '../types/dashboard'

type CardioCardProps = {
  cardio: DashboardCardio | null
}

export function CardioCard({ cardio }: CardioCardProps) {
  if (!cardio) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhum cardio programado para hoje.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
          <HeartPulse size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge tone={cardio.status === 'completed' ? 'success' : 'neutral'}>
            {cardio.plannedTime} · {cardio.status === 'completed'
              ? 'CONCLUÍDO'
              : cardio.status === 'started'
                ? 'EM ANDAMENTO'
                : 'PLANEJADO'}
          </Badge>

          <h3 className="mt-3 text-lg font-bold">{cardio.title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Meta de {cardio.targetDurationMinutes} minutos
          </p>
        </div>
      </div>
      <div className="mt-4"><ProgressBar label="Cardio" value={cardio.status === 'completed' ? 100 : cardio.status === 'started' ? 50 : 0} /></div>

      <Link
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white/10 px-5 font-bold text-white transition hover:bg-white/15"
        to="/cardio"
      >
        Abrir cardio
      </Link>
    </Card>
  )
}
