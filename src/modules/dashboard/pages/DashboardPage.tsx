import { Card, SectionTitle } from '../../../shared/ui'
import { CoachInsightsList } from '../components/CoachInsightsList'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
import { CardioCard } from '../components/CardioCard'
import { MealCard } from '../components/MealCard'
import { MetricsGrid } from '../components/MetricsGrid'
import { ScoreCard } from '../components/ScoreCard'
import { WorkoutCard } from '../components/WorkoutCard'
import { useDashboard } from '../hooks/useDashboard'

function getCurrentDayLabel() {
  const value = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Manaus',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Manaus',
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
  )

  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { data, error, isLoading, registerWater } = useDashboard()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Não foi possível abrir o TITAN</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando seu plano de hoje...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-3">
      <header className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {getCurrentDayLabel()}
          </p>

          <h1 className="mt-2 text-[2.45rem] font-black leading-[1.05] tracking-[-0.045em]">
            {getGreeting()}, {data.userName}
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            Seu dia, no ritmo certo.
          </p>
        </div>

        <div
          aria-label="TITAN"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black shadow-lg shadow-blue-600/20"
        >
          T
        </div>
      </header>

      <section>
        <SectionTitle supportingText="Atualizado agora" title="Visão geral" />
        <ScoreCard score={data.score} />
      </section>

      <section>
        <SectionTitle supportingText="Metas diárias" title="Hoje" />
        <MetricsGrid onAddWater={registerWater} summary={data.summary} />
      </section>

      <section>
        <SectionTitle
          supportingText={`${data.insights.length} prioridade${data.insights.length === 1 ? '' : 's'}`}
          title="Coach TITAN"
        />
        <CoachInsightsList insights={data.insights} />
      </section>

      <section>
        <SectionTitle supportingText="Próxima ação" title="Sua agenda" />
        <MealCard meal={data.nextMeal} />
        <div className="mt-3"><WorkoutCard workout={data.workout} /></div>
        <div className="mt-3"><CardioCard cardio={data.cardio} /></div>
      </section>

      <section>
        <SectionTitle supportingText="Como calculamos" title="Detalhes do score" />
        <ScoreBreakdown breakdown={data.score.breakdown} />
      </section>
    </div>
  )
}
