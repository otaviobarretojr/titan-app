import { Activity } from 'lucide-react'
import { Badge, Card } from '../../../shared/ui'

export function ScoreCard() {
  return (
    <Card elevated>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-3 text-4xl font-black">—</p>
          <p className="mt-1 text-sm text-slate-400">
            Dados insuficientes para calcular o score.
          </p>
        </div>

        <Badge tone="neutral">Aguardando</Badge>
      </div>
    </Card>
  )
}
