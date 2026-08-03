import { Activity } from 'lucide-react'
import { Badge, Card, ProgressBar } from '../../../shared/ui'
import type { TitanScore } from '../../coach/types/coach'

type ScoreCardProps = {
  score: TitanScore
}

const toneByLabel = {
  Excelente: 'success',
  Bom: 'primary',
  Atenção: 'warning',
  Crítico: 'warning',
  'Sem dados': 'neutral',
} as const

export function ScoreCard({ score }: ScoreCardProps) {
  return (
    <Card elevated>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-3 text-4xl font-black">
            {score.value ?? '—'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {score.value === null
              ? 'Registre ações para calcular o score.'
              : 'Calculado com os dados registrados hoje.'}
          </p>
        </div>

        <Badge tone={toneByLabel[score.label]}>{score.label}</Badge>
      </div>

      {score.value !== null ? (
        <div className="mt-5">
          <ProgressBar label="Performance diária" value={score.value} />
        </div>
      ) : null}
    </Card>
  )
}
