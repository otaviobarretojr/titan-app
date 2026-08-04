import { AlertCircle, Bell, ChevronRight, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { InfoBanner, SkeletonPage } from '../../../shared/ui'
import { CoachCard } from '../components/CoachCard'
import { DailyMetricsGrid } from '../components/DailyMetricsGrid'
import { MealCard } from '../components/MealCard'
import { ScoreCard } from '../components/ScoreCard'
import { WorkoutCard } from '../components/WorkoutCard'
import { unreadCount, getNotificationSnapshot } from '../../notifications/data/notificationsRepository'
import { getNotificationPermission } from '../../../services/notifications/notificationService'
import { useDashboard } from '../hooks/useDashboard'

function dayLabel() { const value = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); return value.charAt(0).toUpperCase() + value.slice(1) }
function greeting() { const hour = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', hour: '2-digit', hour12: false }).format(new Date())); return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite' }

export function DashboardPage() {
  const { data, error, isLoading } = useDashboard()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [nextReminder, setNextReminder] = useState<string | null>(null)
  const permission = getNotificationPermission()
  useEffect(() => { void Promise.all([unreadCount(), getNotificationSnapshot()]).then(([count, snapshot]) => { setUnreadNotifications(count); setNextReminder(snapshot.next[0]?.nextRunAt ?? null) }) }, [])
  if (error) return <InfoBanner title="Não foi possível abrir o TITAN" tone="error">{error} Seus registros locais permanecem seguros.</InfoBanner>
  if (isLoading || !data) return <SkeletonPage label="Carregando dashboard premium" variant="dashboard" />

  const insight = data.insights[0]
  return <div className="stagger-in space-y-6 pb-4">
    <header className="flex items-start justify-between gap-4 pb-1 pt-5">
      <div><p className="text-sm font-medium text-slate-400">{dayLabel()}</p><h1 className="mt-2 text-[2.35rem] font-black leading-none tracking-[-0.045em]">{greeting()},<br />{data.userName}</h1></div>
      <Link aria-label={`Notificações${unreadNotifications ? `, ${unreadNotifications} não lidas` : ""}`} className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/6 text-slate-300" to="/notifications"><Bell size={21} />{unreadNotifications ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-black text-white">{unreadNotifications}</span> : null}</Link>
    </header>

    {permission === 'denied' || permission === 'default' ? <Link className="dashboard-card dashboard-link block p-4 text-sm text-slate-300" to="/notifications">Notificações do sistema estão {permission === 'denied' ? 'bloqueadas' : 'pendentes de permissão'}. A Inbox local continua funcionando.</Link> : null}

    {nextReminder ? <Link className="dashboard-card dashboard-link block p-4 text-sm text-slate-300" to="/notifications">Próximo lembrete: {new Date(nextReminder).toLocaleString('pt-BR')}</Link> : null}

    <Link className="block rounded-[28px]" to="/analytics" aria-label="Abrir detalhes do Score TITAN"><ScoreCard score={data.score} /></Link>

    <section aria-labelledby="coach-title">
      <div className="mb-3 flex items-center gap-2"><Sparkles className="text-blue-300" size={17} /><h2 className="text-sm font-extrabold" id="coach-title">Recomendação do Coach</h2></div>
      {insight ? <CoachCard insight={insight} /> : <Link className="dashboard-card dashboard-link block p-5" to="/coach"><p className="font-bold">Tudo em equilíbrio</p><p className="mt-1 text-sm text-slate-400">Continue registrando sua rotina para receber uma nova recomendação.</p></Link>}
    </section>

    <section aria-labelledby="agenda-title"><h2 className="one-ui-title" id="agenda-title">Seu dia</h2><div className="space-y-3"><MealCard meal={data.nextMeal} /><WorkoutCard workout={data.workout} />
      <Link className="dashboard-card dashboard-link flex items-center gap-4 p-5" to="/nutrition"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${data.pendingMeals ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}><AlertCircle size={21} /></div><div className="flex-1"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pendências</p><p className="mt-1 font-extrabold">{data.pendingMeals ? `${data.pendingMeals} ${data.pendingMeals === 1 ? 'refeição atrasada' : 'refeições atrasadas'}` : 'Tudo em dia'}</p></div><ChevronRight className="text-slate-600" size={20} /></Link>
    </div></section>

    <section aria-labelledby="summary-title"><div className="mb-3 flex items-end justify-between"><h2 className="one-ui-title mb-0" id="summary-title">Resumo diário</h2><Link className="text-xs font-bold text-blue-300" to="/reports">Ver relatório</Link></div><DailyMetricsGrid summary={data.summary} /></section>
  </div>
}
