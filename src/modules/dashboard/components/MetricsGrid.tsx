import type { ReactNode } from 'react'
import { Droplets, Dumbbell, Flame, Moon } from 'lucide-react'
import { Card } from '../../../shared/ui'

const metrics = [
  { icon: <Flame size={19} aria-hidden="true" />, label: 'Calorias', value: '0', target: 'Meta 3.624 kcal' },
  { icon: <Dumbbell size={19} aria-hidden="true" />, label: 'Proteína', value: '0 g', target: 'Meta 220 g' },
  { icon: <Droplets size={19} aria-hidden="true" />, label: 'Água', value: '0 L', target: 'Meta 4,5 L' },
  { icon: <Moon size={19} aria-hidden="true" />, label: 'Sono', value: '—', target: 'Meta 7h30' },
]

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
    </div>
  )
}

type MetricCardProps = {
  icon: ReactNode
  label: string
  value: string
  target: string
}

function MetricCard({ icon, label, value, target }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{target}</p>
    </Card>
  )
}
