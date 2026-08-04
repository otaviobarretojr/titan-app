import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../shared/ui'
import type { CoachInsight } from '../types/coach'

type CoachInsightCardProps = {
  insight: CoachInsight
}

const tones = {
  high: 'warning',
  medium: 'primary',
  low: 'success',
} as const

export function CoachInsightCard({
  insight,
}: CoachInsightCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
            {insight.category}
          </p>
          <h2 className="mt-2 font-bold">{insight.title}</h2>
        </div>

        <Badge tone={tones[insight.priority]}>
          {insight.priority === 'high'
            ? 'Alta'
            : insight.priority === 'medium'
              ? 'Média'
              : 'Baixa'}
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        {insight.message}
      </p>

      <p className="mt-3 rounded-2xl bg-white/5 p-3 text-xs leading-5 text-slate-500">
        Evidência: {insight.evidence}<br />Período: {insight.period} · Amostra: {insight.sampleSize}
      </p>

      {insight.actionLabel && insight.actionPath ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
          to={insight.actionPath}
        >
          {insight.actionLabel}
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
      ) : null}
    </Card>
  )
}
