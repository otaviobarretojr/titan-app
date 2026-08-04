import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../shared/ui'
import type { CoachInsight } from '../../coach/types/coach'

type CoachCardProps = {
  insight: CoachInsight
}

const tones = {
  high: 'warning',
  medium: 'primary',
  low: 'success',
} as const

export function CoachCard({ insight }: CoachCardProps) {
  return (
    <Link className="dashboard-card dashboard-link block border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5 p-5" to={insight.actionPath ?? '/coach'}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-300">
          <Sparkles size={18} aria-hidden="true" />
          <span className="text-sm font-bold">COACH TITAN</span>
        </div>

        <Badge tone={tones[insight.priority]}>
          {insight.priority === 'high'
            ? 'Alta'
            : insight.priority === 'medium'
              ? 'Média'
              : 'Baixa'}
        </Badge>
      </div>

      <h2 className="mt-3 text-xl font-bold">{insight.title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        {insight.message}
      </p>

      <span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold text-white">
        {insight.actionLabel ?? 'Ver análise'} <ChevronRight size={17} aria-hidden="true" />
      </span>
    </Link>
  )
}
