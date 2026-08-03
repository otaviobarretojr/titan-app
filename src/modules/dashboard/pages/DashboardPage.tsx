import { Card, SectionTitle } from '../../../shared/ui'
import { CoachCard } from '../components/CoachCard'
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
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {getCurrentDayLabel()}
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {getGreeting()}, {data.userName}
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            Sua próxima decisão está logo abaixo.
          </p>
        </div>

        <div
          aria-label="TITAN"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-black shadow-lg shadow-blue-600/20"
        >
          T
        </div>
      </header>

      {data.coachMessage ? (
        <CoachCard
          message={data.coachMessage.message}
          title={data.coachMessage.title}
        />
      ) : null}

      <section>
        <SectionTitle supportingText="Próxima ação" title="Agora" />
        <MealCard meal={data.nextMeal} />
      </section>

      <section>
        <SectionTitle title="Treino do dia" />
        <WorkoutCard workout={data.workout} />
      </section>

      <section>
        <SectionTitle title="Score TITAN" />
        <ScoreCard />
      </section>

      <section>
        <SectionTitle title="Resumo de hoje" />
        <MetricsGrid
          onAddWater={registerWater}
          summary={data.summary}
        />
      </section>
    </div>
  )
}
