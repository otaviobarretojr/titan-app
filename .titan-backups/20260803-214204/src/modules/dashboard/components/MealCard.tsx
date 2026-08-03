import { Utensils } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'
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

      <Button className="mt-5" fullWidth>
        Abrir refeição
      </Button>
    </Card>
  )
}
