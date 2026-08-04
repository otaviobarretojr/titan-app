import { ChevronRight, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card, ProgressBar } from '../../../shared/ui'
import type { DashboardWorkout } from '../types/dashboard'

type WorkoutCardProps = {
  workout: DashboardWorkout | null
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  if (!workout) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhum treino programado para hoje.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
          <Dumbbell size={24} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge>{workout.plannedTime} · TREINO</Badge>

          <h3 className="mt-3 text-lg font-bold">{workout.name}</h3>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {workout.exerciseCount} exercícios · aproximadamente{' '}
            {workout.estimatedDurationMinutes} minutos
          </p>
        </div>
      </div>
      <div className="mt-4"><ProgressBar label="Treino" value={workout.status === 'completed' ? 100 : workout.status === 'started' ? 50 : 0} /></div>

      <Link className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 font-bold text-slate-950 transition hover:bg-slate-200 active:scale-[0.98]" to="/training">
        {workout.status === 'started' ? 'Continuar treino' : workout.status === 'completed' ? 'Ver treino concluído' : 'Iniciar treino'}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  )
}
