import { CheckCircle2, ChevronRight, Clock3, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardMeal } from '../types/dashboard'

type MealCardProps = { meal: DashboardMeal | null }

const stateCopy = {
  normal: { label: 'No horário', color: 'text-amber-300 bg-amber-400/10', icon: Clock3 },
  overdue: { label: 'Atrasada', color: 'text-rose-300 bg-rose-400/10', icon: Clock3 },
  completed: { label: 'Concluída', color: 'text-emerald-300 bg-emerald-400/10', icon: CheckCircle2 },
} as const

export function MealCard({ meal }: MealCardProps) {
  if (!meal) {
    return <div className="dashboard-card p-5 text-sm text-slate-400">Nenhuma refeição planejada para hoje.</div>
  }

  const state = stateCopy[meal.status]
  const StateIcon = state.icon
  return (
    <Link className="dashboard-card dashboard-link block p-5" to={`/nutrition/${meal.id}`} aria-label={`Abrir refeição ${meal.name}`}>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-amber-400/10 text-amber-300"><Utensils size={23} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Próxima refeição</p>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${state.color}`}><StateIcon size={13} />{state.label}</span>
          </div>
          <h2 className="mt-2 text-lg font-extrabold">{meal.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{meal.plannedTime} · {meal.caloriesKcal} kcal · {meal.proteinG} g proteína</p>
        </div>
        <ChevronRight className="mt-8 shrink-0 text-slate-600" size={20} />
      </div>
    </Link>
  )
}
