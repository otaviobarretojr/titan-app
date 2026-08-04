import { Card, ProgressBar } from '../../../shared/ui'
import type {
  CoachCategory,
  TitanScoreBreakdown,
} from '../../coach/types/coach'

type ScoreBreakdownProps = {
  breakdown: TitanScoreBreakdown
  measuredCategories?: CoachCategory[]
}

export function ScoreBreakdown({
  breakdown,
  measuredCategories,
}: ScoreBreakdownProps) {
  const metrics: Array<{
    category: CoachCategory
    label: string
    value: number
  }> = [
    { category: 'nutrition', label: 'Nutrição', value: breakdown.nutrition },
    { category: 'hydration', label: 'Hidratação', value: breakdown.hydration },
    { category: 'training', label: 'Treino', value: breakdown.training },
    { category: 'cardio', label: 'Cardio', value: breakdown.cardio },
    { category: 'recovery', label: 'Recuperação', value: breakdown.recovery },
    { category: 'consistency', label: 'Consistência', value: breakdown.consistency },
  ]
  const visibleMetrics = measuredCategories
    ? metrics.filter((metric) => measuredCategories.includes(metric.category))
    : metrics

  return (
    <Card>
      <h2 className="text-lg font-bold">Composição do score</h2>

      <div className="mt-5 space-y-4">
        {visibleMetrics.map((metric) => (
          <ProgressBar
            key={metric.category}
            label={metric.label}
            value={metric.value}
          />
        ))}
        {visibleMetrics.length === 0 ? (
          <p className="text-sm text-slate-400">
            Registre atividades para calcular a composição.
          </p>
        ) : null}
      </div>
    </Card>
  )
}
