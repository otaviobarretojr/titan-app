import { Activity } from 'lucide-react'
import { Badge, Card, ProgressBar } from '../../../shared/ui'

export function ScoreCard() {
  return (
    <Card elevated>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-3 text-4xl font-black">72</p>
          <p className="mt-1 text-sm text-slate-400">Base demonstrativa, ainda sem dados reais.</p>
        </div>

        <Badge tone="primary">Bom</Badge>
      </div>

      <div className="mt-5">
        <ProgressBar label="Consistência diária" value={72} />
      </div>
    </Card>
  )
}
