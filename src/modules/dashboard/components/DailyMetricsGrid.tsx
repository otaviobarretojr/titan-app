import type { ReactNode } from 'react'
import { Droplets, Flame, Moon, Utensils } from 'lucide-react'
import { Card } from '../../../shared/ui'
import type { DashboardSummary } from '../types/dashboard'

type DailyMetricsGridProps = {
  summary: DashboardSummary
}

function formatSleep(minutes: number | null) {
  if (minutes === null) return '—'
  return `${Math.floor(minutes / 60)}h${(minutes % 60)
    .toString()
    .padStart(2, '0')}`
}

export function DailyMetricsGrid({
  summary,
}: DailyMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Metric
        icon={<Flame size={18} aria-hidden="true" />}
        label="Calorias"
        value={`${summary.caloriesConsumedKcal.toLocaleString('pt-BR')}`}
        target={`/${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`}
      />
      <Metric
        icon={<Utensils size={18} aria-hidden="true" />}
        label="Proteína"
        value={`${summary.proteinConsumedG}`}
        target={`/${summary.proteinTargetG} g`}
      />
      <Metric
        icon={<Droplets size={18} aria-hidden="true" />}
        label="Água"
        value={`${(summary.hydrationConsumedMl / 1000).toLocaleString(
          'pt-BR',
          { maximumFractionDigits: 1 },
        )}`}
        target={`/${(summary.hydrationTargetMl / 1000).toLocaleString(
          'pt-BR',
          { maximumFractionDigits: 1 },
        )} L`}
      />
      <Metric
        icon={<Moon size={18} aria-hidden="true" />}
        label="Sono"
        value={formatSleep(summary.sleepMinutes)}
        target={`/${formatSleep(summary.sleepTargetMinutes)}`}
      />
    </div>
  )
}

type MetricProps = {
  icon: ReactNode
  label: string
  value: string
  target: string
}

function Metric({
  icon,
  label,
  value,
  target,
}: MetricProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-3 text-xl font-black">
        {value}
        <span className="ml-1 text-xs font-semibold text-slate-500">
          {target}
        </span>
      </p>
    </Card>
  )
}
