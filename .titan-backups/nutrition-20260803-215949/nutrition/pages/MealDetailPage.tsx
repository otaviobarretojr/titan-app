import { ArrowLeft, Check, CircleOff, RefreshCw } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from '../../../shared/ui'
import { MealStatusBadge } from '../components/MealStatusBadge'
import { useNutritionDay } from '../hooks/useNutritionDay'

export function MealDetailPage() {
  const { mealId } = useParams()
  const navigate = useNavigate()
  const {
    data,
    error,
    isLoading,
    completeMeal,
    registerPartialMeal,
    substituteMeal,
    skipMeal,
    clearMealEntry,
  } = useNutritionDay()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <p className="font-bold">Não foi possível abrir a refeição.</p>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando refeição...
        </p>
      </div>
    )
  }

  const meal = data.meals.find((item) => item.id === mealId)

  if (!meal) {
    return <Navigate to="/nutrition" replace />
  }

  async function execute(action: () => Promise<void>) {
    await action()
    navigate('/nutrition')
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl text-sm font-bold text-slate-300"
        to="/nutrition"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-blue-300">
            {meal.plannedTime}
          </span>
          <MealStatusBadge status={meal.status} />
        </div>

        <h1 className="mt-3 text-3xl font-black">{meal.name}</h1>
      </header>

      <Card elevated>
        <h2 className="text-lg font-bold">Planejamento</h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric label="Calorias" value={`${meal.caloriesKcal} kcal`} />
          <Metric label="Proteína" value={`${meal.proteinG} g`} />
          <Metric
            label="Carboidratos"
            value={`${meal.carbohydrateG} g`}
          />
          <Metric label="Gorduras" value={`${meal.fatG} g`} />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">Registrar refeição</h2>

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={() => execute(() => completeMeal(meal.id))}
          >
            <Check size={19} aria-hidden="true" />
            Consumida integralmente
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() =>
                execute(() => registerPartialMeal(meal.id, 50))
              }
              variant="ghost"
            >
              Registrar 50%
            </Button>

            <Button
              onClick={() =>
                execute(() => registerPartialMeal(meal.id, 75))
              }
              variant="ghost"
            >
              Registrar 75%
            </Button>
          </div>

          <Button
            fullWidth
            onClick={() => execute(() => substituteMeal(meal.id))}
            variant="ghost"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Registrar substituição equivalente
          </Button>

          <Button
            fullWidth
            onClick={() => execute(() => skipMeal(meal.id))}
            variant="ghost"
          >
            <CircleOff size={18} aria-hidden="true" />
            Não realizada
          </Button>

          {meal.status !== 'planned' && meal.status !== 'pending' ? (
            <Button
              fullWidth
              onClick={() => execute(() => clearMealEntry(meal.id))}
              variant="ghost"
            >
              Limpar registro
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  )
}

type MetricProps = {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  )
}
