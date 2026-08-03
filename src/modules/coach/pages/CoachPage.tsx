import { Brain, Sparkles } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { ScoreBreakdown } from '../../dashboard/components/ScoreBreakdown'
import { CoachInsightCard } from '../components/CoachInsightCard'
import { CoachTrendCard } from '../components/CoachTrendCard'
import { useCoachReport } from '../hooks/useCoachReport'

export function CoachPage() {
  const { report, isLoading } = useCoachReport()

  if (isLoading || !report) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando análise...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-blue-300">
          <Brain size={22} aria-hidden="true" />
          <p className="text-sm font-bold uppercase tracking-widest">
            COACH TITAN
          </p>
        </div>

        <h1 className="mt-3 text-3xl font-black">
          Análise inteligente
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Recomendações geradas a partir dos registros reais do TITAN.
        </p>
      </header>

      <Card elevated>
        <div className="flex items-center gap-2 text-blue-300">
          <Sparkles size={18} aria-hidden="true" />
          <span className="text-sm font-bold">
            RESUMO EXECUTIVO
          </span>
        </div>

        <p className="mt-4 text-lg font-bold leading-7">
          {report.executiveSummary}
        </p>

        <div className="mt-5 flex items-end gap-3">
          <span className="text-5xl font-black">
            {report.score.value ?? '—'}
          </span>
          <span className="pb-1 text-sm font-bold text-slate-400">
            {report.score.label}
          </span>
        </div>
      </Card>

      <ScoreBreakdown breakdown={report.score.breakdown} />

      <section>
        <SectionTitle
          title="Prioridades de hoje"
          supportingText={`${report.dailyInsights.length} análises`}
        />

        <div className="space-y-3">
          {report.dailyInsights.map((insight) => (
            <CoachInsightCard
              insight={insight}
              key={insight.id}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Tendências semanais"
          supportingText={`${report.weeklyTrends.length} indicadores`}
        />

        <div className="space-y-3">
          {report.weeklyTrends.map((trend) => (
            <CoachTrendCard
              key={trend.id}
              trend={trend}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
