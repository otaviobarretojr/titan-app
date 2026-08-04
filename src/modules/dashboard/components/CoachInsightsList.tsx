import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card, EmptyState } from '../../../shared/ui'
import type { CoachInsight } from '../../coach/types/coach'

type CoachInsightsListProps = {
  insights: CoachInsight[]
}

const tones = {
  high: 'warning',
  medium: 'primary',
  low: 'success',
} as const

export function CoachInsightsList({
  insights,
}: CoachInsightsListProps) {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5">
      <div className="flex items-center gap-2 text-blue-300">
        <Sparkles size={18} aria-hidden="true" />
        <span className="text-sm font-bold">COACH TITAN</span>
      </div>

      <div className="mt-4 space-y-4">
        {insights.length === 0 ? (
          <EmptyState title="Tudo em equilíbrio" description="Continue registrando sua rotina. O Coach criará prioridades somente quando houver evidências locais." />
        ) : null}
        {insights.map((insight, index) => (
          <div
            className={index > 0 ? 'border-t border-white/10 pt-4' : ''}
            key={insight.id}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">{insight.title}</h2>
              <Badge tone={tones[insight.priority]}>
                {insight.priority === 'high'
                  ? 'Alta'
                  : insight.priority === 'medium'
                    ? 'Média'
                    : 'Baixa'}
              </Badge>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {insight.message}
            </p>

            {insight.actionLabel && insight.actionPath ? (
              <Link
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-bold text-white"
                to={insight.actionPath}
              >
                Ver detalhes
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}
