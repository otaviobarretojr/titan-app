import { ChevronRight, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../shared/ui'
import type { DashboardMeal } from '../types/dashboard'

type MealCardProps = {
  meal: DashboardMeal | null
}

export function MealCard({ meal }: MealCardProps) {
  if (!meal) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhuma refeição pendente para hoje.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Utensils size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge tone="warning">
            {meal.plannedTime} · {meal.name.toUpperCase()}
          </Badge>

          <h3 className="mt-3 text-lg font-bold">Próxima refeição</h3>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {meal.caloriesKcal} kcal · {meal.proteinG} g de proteína
          </p>
        </div>
      </div>

      <Link aria-label={`Abrir ${meal.name}`} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-500 active:scale-[0.98]" to={`/nutrition/${meal.id}`}>
        Abrir refeição <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  )
}
