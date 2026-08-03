import type { ReactNode } from 'react'
import {
  Activity,
  Droplets,
  Dumbbell,
  Moon,
  Utensils,
} from 'lucide-react'
import { Card, ProgressBar } from '../../../shared/ui'
import { useWeeklyReport } from '../hooks/useWeeklyReport'

function formatSleep(minutes: number | null) {
  if (minutes === null) return '—'

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return `${hours}h${rest.toString().padStart(2, '0')}`
}

export function ReportsPage() {
  const { report, isLoading } = useWeeklyReport()

  if (isLoading || !report) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando relatório...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN RELATÓRIOS
        </p>
        <h1 className="mt-2 text-3xl font-black">Últimos 7 dias</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Resumo calculado apenas com registros reais salvos no TITAN.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Utensils size={19} aria-hidden="true" />}
          label="Proteína média"
          value={`${report.averageProteinG} g`}
        />
        <MetricCard
          icon={<Droplets size={19} aria-hidden="true" />}
          label="Água média"
          value={`${(report.averageHydrationMl / 1000).toLocaleString(
            'pt-BR',
            { maximumFractionDigits: 1 },
          )} L`}
        />
        <MetricCard
          icon={<Moon size={19} aria-hidden="true" />}
          label="Sono médio"
          value={formatSleep(report.averageSleepMinutes)}
        />
        <MetricCard
          icon={<Activity size={19} aria-hidden="true" />}
          label="Calorias médias"
          value={`${report.averageCaloriesKcal.toLocaleString(
            'pt-BR',
          )} kcal`}
        />
      </div>

      <Card elevated>
        <h2 className="text-lg font-bold">Consistência</h2>

        <div className="mt-5 space-y-5">
          <ProgressBar
            label="Refeições registradas"
            value={report.mealCompletionRate}
          />
          <ProgressBar
            label="Treinos concluídos"
            value={report.workoutCompletionRate}
          />
          <ProgressBar
            label="Cardios concluídos"
            value={report.cardioCompletionRate}
          />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">Linha da semana</h2>

        <div className="space-y-3">
          {report.days.map((day) => (
            <Card key={day.localDate} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    }).format(new Date(`${day.localDate}T12:00:00`))}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {day.proteinConsumedG} g proteína ·{' '}
                    {(day.hydrationConsumedMl / 1000).toLocaleString(
                      'pt-BR',
                      { maximumFractionDigits: 1 },
                    )}{' '}
                    L água
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusIcon active={day.workoutCompleted}>
                    <Dumbbell size={17} aria-hidden="true" />
                  </StatusIcon>
                  <StatusIcon active={day.cardioCompleted}>
                    <Activity size={17} aria-hidden="true" />
                  </StatusIcon>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

type MetricCardProps = {
  icon: ReactNode
  label: string
  value: string
}

function MetricCard({
  icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-4 text-xl font-black">{value}</p>
    </Card>
  )
}

type StatusIconProps = {
  active: boolean
  children: ReactNode
}

function StatusIcon({
  active,
  children,
}: StatusIconProps) {
  return (
    <div
      className={[
        'flex h-9 w-9 items-center justify-center rounded-xl',
        active
          ? 'bg-emerald-500/10 text-emerald-300'
          : 'bg-white/5 text-slate-600',
      ].join(' ')}
    >
      {children}
    </div>
  )
}
