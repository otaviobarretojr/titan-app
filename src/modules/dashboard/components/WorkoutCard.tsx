import { CheckCircle2, ChevronRight, Dumbbell, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardWorkout } from '../types/dashboard'

type WorkoutCardProps = { workout: DashboardWorkout | null }

export function WorkoutCard({ workout }: WorkoutCardProps) {
  if (!workout) return <div className="dashboard-card p-5 text-sm text-slate-400">Você ainda não possui um plano de treino ativo.</div>
  const completed = workout.status === 'completed'
  const started = workout.status === 'started'
  const action = completed ? 'Treino concluído' : started ? 'Continuar treino' : 'Iniciar treino'
  return (
    <Link className="dashboard-card dashboard-link block p-5" to="/training">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] ${completed ? 'bg-emerald-400/10 text-emerald-300' : 'bg-violet-400/10 text-violet-300'}`}><Dumbbell size={23} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Treino de hoje · {workout.plannedTime}</p>
          <h2 className="mt-2 truncate text-lg font-extrabold">{workout.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{workout.exerciseCount} exercícios · {workout.estimatedDurationMinutes} min</p>
          <span className={`mt-3 inline-flex items-center gap-1.5 text-sm font-bold ${completed ? 'text-emerald-300' : 'text-blue-300'}`}>{completed ? <CheckCircle2 size={16} /> : <Play size={15} fill="currentColor" />}{action}</span>
        </div>
        <ChevronRight className="shrink-0 text-slate-600" size={20} />
      </div>
    </Link>
  )
}
