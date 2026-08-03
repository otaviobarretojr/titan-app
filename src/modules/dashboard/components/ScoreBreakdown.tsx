import { Card, ProgressBar } from '../../../shared/ui'
import type { TitanScoreBreakdown } from '../../coach/types/coach'

type ScoreBreakdownProps = {
  breakdown: TitanScoreBreakdown
}

export function ScoreBreakdown({
  breakdown,
}: ScoreBreakdownProps) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Composição do score</h2>

      <div className="mt-5 space-y-4">
        <ProgressBar label="Nutrição" value={breakdown.nutrition} />
        <ProgressBar label="Hidratação" value={breakdown.hydration} />
        <ProgressBar label="Treino" value={breakdown.training} />
        <ProgressBar label="Cardio" value={breakdown.cardio} />
        <ProgressBar label="Recuperação" value={breakdown.recovery} />
      </div>
    </Card>
  )
}
