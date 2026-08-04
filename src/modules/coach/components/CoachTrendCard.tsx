import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
} from 'lucide-react'
import { Card } from '../../../shared/ui'
import type { CoachTrend } from '../types/coach'

type CoachTrendCardProps = {
  trend: CoachTrend
}

export function CoachTrendCard({
  trend,
}: CoachTrendCardProps) {
  const Icon =
    trend.direction === 'up'
      ? ArrowUp
      : trend.direction === 'down'
        ? ArrowDown
        : ArrowRight

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-blue-300">
          <Icon size={18} aria-hidden="true" />
        </div>

        <div>
          <h3 className="font-bold">{trend.title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {trend.message}
          </p>
          <p className="mt-1 text-xs text-slate-500">{trend.sampleSize} amostra(s) atuais · {trend.previousSampleSize} anteriores</p>
        </div>
      </div>
    </Card>
  )
}
