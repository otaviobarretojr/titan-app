import type { ReactNode } from 'react'
import { Check, Droplets, Dumbbell, Flame, Moon, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import type { DashboardSummary } from '../types/dashboard'

type MetricsGridProps = {
  summary: DashboardSummary
  onAddWater: (amountMl: number) => Promise<void>
}

function formatLiters(valueMl: number) {
  return `${(valueMl / 1000).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })} L`
}

function formatSleep(valueMinutes: number | null) {
  if (valueMinutes === null) return '—'

  const hours = Math.floor(valueMinutes / 60)
  const minutes = valueMinutes % 60

  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

export function MetricsGrid({
  summary,
  onAddWater,
}: MetricsGridProps) {
  const [waterRegistered, setWaterRegistered] = useState(false)

  async function handleAddWater() {
    await onAddWater(300)
    setWaterRegistered(true)
    window.setTimeout(() => setWaterRegistered(false), 2200)
  }

  const metrics = [
    {
      icon: <Flame size={19} aria-hidden="true" />,
      label: 'Calorias',
      value: summary.caloriesConsumedKcal.toLocaleString('pt-BR'),
      target: `Meta ${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`,
      progress: Math.round(summary.caloriesConsumedKcal / summary.calorieTargetKcal * 100),
    },
    {
      icon: <Dumbbell size={19} aria-hidden="true" />,
      label: 'Proteína',
      value: `${summary.proteinConsumedG} g`,
      target: `Meta ${summary.proteinTargetG} g`,
      progress: Math.round(summary.proteinConsumedG / summary.proteinTargetG * 100),
    },
    {
      icon: <Droplets size={19} aria-hidden="true" />,
      label: 'Água',
      value: formatLiters(summary.hydrationConsumedMl),
      target: `Meta ${formatLiters(summary.hydrationTargetMl)}`,
      progress: Math.round(summary.hydrationConsumedMl / summary.hydrationTargetMl * 100),
    },
    {
      icon: <Moon size={19} aria-hidden="true" />,
      label: 'Sono',
      value: formatSleep(summary.sleepMinutes),
      target: `Meta ${formatSleep(summary.sleepTargetMinutes)}`,
      progress: Math.round((summary.sleepMinutes ?? 0) / summary.sleepTargetMinutes * 100),
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <Button
        className="mt-3"
        fullWidth
        aria-live="polite"
        onClick={handleAddWater}
        variant="ghost"
      >
        {waterRegistered ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        {waterRegistered ? '300 ml registrados' : 'Registrar 300 ml de água'}
      </Button>
    </div>
  )
}

type MetricCardProps = {
  icon: ReactNode
  label: string
  value: string
  target: string
  progress: number
}

function MetricCard({
  icon,
  label,
  value,
  target,
  progress,
}: MetricCardProps) {
  return (
    <Card className="p-4 shadow-[0_8px_30px_rgb(0_0_0/0.12)]">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{target}</p>
      <div className="mt-3"><ProgressBar label={`Progresso de ${label.toLowerCase()}`} value={progress} /></div>
    </Card>
  )
}
