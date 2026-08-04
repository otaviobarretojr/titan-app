import { Droplets, Flame, Moon, Salad } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardSummary } from '../types/dashboard'

const percent = (value: number, target: number) => Math.min(100, Math.round(value / target * 100))
const sleep = (minutes: number | null) => minutes === null ? '—' : `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`

export function DailyMetricsGrid({ summary }: { summary: DashboardSummary }) {
  const metrics = [
    { label: 'Proteína', value: `${summary.proteinConsumedG} g`, progress: percent(summary.proteinConsumedG, summary.proteinTargetG), icon: Salad, to: '/nutrition', tone: 'text-emerald-300' },
    { label: 'Calorias', value: summary.caloriesConsumedKcal.toLocaleString('pt-BR'), progress: percent(summary.caloriesConsumedKcal, summary.calorieTargetKcal), icon: Flame, to: '/nutrition', tone: 'text-orange-300' },
    { label: 'Água', value: `${(summary.hydrationConsumedMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`, progress: percent(summary.hydrationConsumedMl, summary.hydrationTargetMl), icon: Droplets, to: '/nutrition', tone: 'text-sky-300' },
    { label: 'Sono', value: sleep(summary.sleepMinutes), progress: percent(summary.sleepMinutes ?? 0, summary.sleepTargetMinutes), icon: Moon, to: '/health/sleep', tone: 'text-violet-300' },
  ]
  return <div className="grid grid-cols-2 gap-3">{metrics.map(({ icon: Icon, ...metric }) => (
    <Link className="dashboard-card dashboard-link p-4" key={metric.label} to={metric.to}>
      <div className={`flex items-center gap-2 ${metric.tone}`}><Icon size={17} /><span className="text-xs font-bold text-slate-400">{metric.label}</span></div>
      <p className="mt-3 text-xl font-black">{metric.value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-current" style={{ width: `${metric.progress}%` }} /></div>
      <p className="mt-2 text-[11px] font-semibold text-slate-500">{metric.progress}% da meta</p>
    </Link>
  ))}</div>
}
