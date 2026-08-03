import type { ReactNode } from 'react'
import { Activity, HeartPulse, ShieldAlert } from 'lucide-react'
import { Card } from '../../../shared/ui'
import { HealthExamForm } from '../components/HealthExamForm'
import { HealthHistory } from '../components/HealthHistory'
import { HealthMetricForm } from '../components/HealthMetricForm'
import { useHealth } from '../hooks/useHealth'

export function HealthPage() {
  const {
    summary,
    error,
    isLoading,
    saveMetric,
    deleteMetric,
    saveExam,
    deleteExam,
  } = useHealth()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro na saúde</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando saúde...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">
          TITAN SAÚDE
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Saúde e acompanhamento
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre sinais, sintomas e exames sem substituir avaliação médica.
        </p>
      </header>

      <Card elevated>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon={<HeartPulse size={19} aria-hidden="true" />}
            label="FC média"
            value={
              summary.averageRestingHeartRate !== null
                ? `${summary.averageRestingHeartRate} bpm`
                : '—'
            }
          />

          <Metric
            icon={<Activity size={19} aria-hidden="true" />}
            label="Pressão recente"
            value={
              summary.latestMetric?.systolicPressure &&
              summary.latestMetric?.diastolicPressure
                ? `${summary.latestMetric.systolicPressure}/${summary.latestMetric.diastolicPressure}`
                : '—'
            }
          />
        </div>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <div className="flex gap-3">
          <ShieldAlert
            className="shrink-0 text-amber-300"
            size={22}
            aria-hidden="true"
          />

          <p className="text-sm leading-6 text-slate-400">
            O TITAN organiza informações. Ele não diagnostica, não interpreta
            exames e não prescreve medicamentos.
          </p>
        </div>
      </Card>

      <HealthMetricForm onSave={saveMetric} />
      <HealthExamForm onSave={saveExam} />

      <HealthHistory
        exams={summary.exams}
        metrics={summary.metrics}
        onDeleteExam={deleteExam}
        onDeleteMetric={deleteMetric}
      />
    </div>
  )
}

type MetricProps = {
  icon: ReactNode
  label: string
  value: string
}

function Metric({
  icon,
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  )
}
