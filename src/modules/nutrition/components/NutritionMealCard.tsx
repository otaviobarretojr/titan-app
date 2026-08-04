import { ChevronRight, RotateCcw, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import type { NutritionMeal } from '../types/nutrition'
import { MealStatusBadge } from './MealStatusBadge'

type NutritionMealCardProps = {
  meal: NutritionMeal
  onReset: (mealId: string) => Promise<unknown>
}

const finalStatuses = new Set([
  'partial',
  'completed',
  'substituted',
  'skipped',
])

export function NutritionMealCard({
  meal,
  onReset,
}: NutritionMealCardProps) {
  return (
    <Card className={meal.status === 'completed' ? 'set-complete border-emerald-500/25 bg-emerald-500/5' : meal.status === 'planned' ? 'border-l-4 border-l-amber-400' : ''}>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
          <Utensils size={22} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-300">
              {meal.plannedTime}
            </span>
            <MealStatusBadge status={meal.status} />
          </div>

          <h2 className="mt-3 text-lg font-bold">{meal.name}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {meal.caloriesKcal} kcal · {meal.proteinG} g proteína ·{' '}
            {meal.carbohydrateG} g carboidratos
          </p>
        </div>
      </div>

      {meal.completionPercentage > 0 ? (
        <div className="mt-4">
          <ProgressBar
            label={`${meal.completionPercentage}% registrado`}
            value={meal.completionPercentage}
          />
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <Link
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 font-bold text-white transition hover:bg-blue-500"
          to={`/nutrition/${meal.id}`}
        >
          Abrir
          <ChevronRight size={18} aria-hidden="true" />
        </Link>

        {finalStatuses.has(meal.status) ? (
          <Button
            aria-label={`Limpar registro de ${meal.name}`}
            onClick={() => onReset(meal.id)}
            variant="ghost"
          >
            <RotateCcw size={18} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
