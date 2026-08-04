import { Clock3, Scale, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { InfoBanner, LoadingCard, SectionHeader, StatCard } from '../../../shared/ui'
import { CardioCard } from '../components/CardioCard'
import { CoachInsightsList } from '../components/CoachInsightsList'
import { MealCard } from '../components/MealCard'
import { MetricsGrid } from '../components/MetricsGrid'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
import { ScoreCard } from '../components/ScoreCard'
import { WorkoutCard } from '../components/WorkoutCard'
import { useDashboard } from '../hooks/useDashboard'

const dashboardCardOrder = ['score', 'agenda', 'wellbeing', 'coach', 'week', 'timeline', 'next', 'details'] as const

function getCurrentDayLabel() {
  const value = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getGreeting() {
  const hour = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', hour: '2-digit', hour12: false }).format(new Date()))
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { data, error, isLoading, registerWater } = useDashboard()

  if (error) return <InfoBanner title="Não foi possível abrir o TITAN" tone="error">{error} Seus registros locais permanecem seguros; feche e abra o app para tentar novamente.</InfoBanner>

  if (isLoading || !data) {
    return <div aria-label="Carregando dashboard" className="space-y-4" role="status"><div className="skeleton h-28 rounded-[28px]" /><LoadingCard lines={3} label="Carregando Score TITAN" /><div className="grid grid-cols-2 gap-3"><LoadingCard /><LoadingCard /></div></div>
  }

  const cards = {
    score: <section aria-labelledby="score-heading" key="score"><SectionHeader description="Atualizado com seus registros locais" id="score-heading" title="Score TITAN" /><ScoreCard score={data.score} /></section>,
    agenda: <section aria-labelledby="agenda-heading" key="agenda"><SectionHeader description="As próximas ações do seu plano" id="agenda-heading" title="Agenda inteligente" /><MealCard meal={data.nextMeal} /><div className="mt-3 grid grid-cols-2 gap-3"><StatCard icon={<UtensilsCrossed aria-hidden="true" size={19} />} label="Pendentes" supportingText="refeições atrasadas" value={String(data.pendingMeals)} /><StatCard icon={<Scale aria-hidden="true" size={19} />} label="Peso" supportingText={data.weight.changeKg === null ? 'sem comparação anterior' : `${data.weight.changeKg > 0 ? '+' : ''}${data.weight.changeKg.toLocaleString('pt-BR')} kg desde o último registro`} value={data.weight.currentKg === null ? '—' : `${data.weight.currentKg.toLocaleString('pt-BR')} kg`} /></div><div className="mt-3"><WorkoutCard workout={data.workout} /></div><div className="mt-3"><CardioCard cardio={data.cardio} /></div></section>,
    wellbeing: <section aria-labelledby="wellbeing-heading" key="wellbeing"><SectionHeader description="Água, sono e nutrição em um só lugar" id="wellbeing-heading" title="Bem-estar" /><MetricsGrid onAddWater={registerWater} summary={data.summary} /></section>,
    coach: <section aria-labelledby="coach-heading" key="coach"><SectionHeader description={`${data.insights.length} prioridade${data.insights.length === 1 ? '' : 's'} baseada em evidências`} id="coach-heading" title="Coach Prioritário" /><CoachInsightsList insights={data.insights} /></section>,
    week: <section aria-labelledby="week-heading" key="week"><SectionHeader id="week-heading" title="Resumo da Semana" /><InfoBanner title="Análise dos registros locais">{data.coach?.weeklySummary ?? 'Ainda não há informação suficiente para resumir a semana.'}</InfoBanner></section>,
    timeline: <section aria-labelledby="timeline-heading" key="timeline"><SectionHeader id="timeline-heading" title="Timeline" /><div className="space-y-2">{data.coach?.timeline.slice(0,4).map(event=><div className="surface-card flex gap-3 rounded-2xl p-4" key={event.id}><Clock3 className="shrink-0 text-blue-300" size={18}/><div><p className="text-sm font-bold">{event.title}</p><p className="text-xs text-slate-500">{event.localDate} · {event.detail}</p></div></div>)}{!data.coach?.timeline.length?<InfoBanner title="Timeline vazia">Nenhum evento foi registrado nos últimos 30 dias.</InfoBanner>:null}</div></section>,
    next: <section aria-labelledby="next-heading" key="next"><SectionHeader id="next-heading" title="Próxima ação" /><InfoBanner title={data.coach?.dailyInsights[0]?.actionLabel ?? 'Continue registrando'}>{data.coach?.dailyInsights[0]?.message ?? 'Não há dados suficientes para indicar uma ação específica.'}<Sparkles className="mt-3 text-blue-300" size={18}/></InfoBanner></section>,
    details: <section aria-labelledby="details-heading" key="details"><SectionHeader action={<Link className="rounded-lg px-2 py-1 text-xs font-bold text-blue-300 hover:bg-blue-500/10" to="/analytics">Ver analytics</Link>} description="Transparência em cada categoria" id="details-heading" title="Detalhes do score" /><ScoreBreakdown breakdown={data.score.breakdown} /></section>,
  }

  return <div className="stagger-in space-y-8 pb-3"><header className="flex items-start justify-between gap-4 pt-2"><div><p className="text-sm font-medium text-slate-400">{getCurrentDayLabel()}</p><h1 className="mt-2 text-[2.45rem] font-black leading-[1.05] tracking-[-0.045em]">{getGreeting()}, {data.userName}</h1><p className="mt-1 text-sm leading-6 text-slate-400">Seu dia, no ritmo certo.</p></div><div aria-label="TITAN" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black shadow-lg shadow-blue-600/20">T</div></header>{dashboardCardOrder.map((card) => cards[card])}</div>
}
