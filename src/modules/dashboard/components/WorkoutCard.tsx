import { Dumbbell } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'
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

      <Button className="mt-5" fullWidth variant="secondary">
        Iniciar treino
      </Button>
    </Card>
  )
}
