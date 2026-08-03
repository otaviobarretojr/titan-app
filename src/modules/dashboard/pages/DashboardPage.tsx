import { SectionTitle } from '../../../shared/ui'
import { CoachCard } from '../components/CoachCard'
import { MealCard } from '../components/MealCard'
import { MetricsGrid } from '../components/MetricsGrid'
import { ScoreCard } from '../components/ScoreCard'
import { WorkoutCard } from '../components/WorkoutCard'

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
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{getCurrentDayLabel()}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{getGreeting()}, Otávio</h1>
          <p className="mt-1 text-sm leading-6 text-slate-400">Sua próxima decisão está logo abaixo.</p>
        </div>

        <div aria-label="TITAN" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-black shadow-lg shadow-blue-600/20">
          T
        </div>
      </header>

      <CoachCard />

      <section>
        <SectionTitle supportingText="Próxima ação" title="Agora" />
        <MealCard />
      </section>

      <section>
        <SectionTitle title="Treino do dia" />
        <WorkoutCard />
      </section>

      <section>
        <SectionTitle title="Score TITAN" />
        <ScoreCard />
      </section>

      <section>
        <SectionTitle title="Resumo de hoje" />
        <MetricsGrid />
      </section>
    </div>
  )
}
