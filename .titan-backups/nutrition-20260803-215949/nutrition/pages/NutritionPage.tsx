import { AlertTriangle } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { NutritionMealCard } from '../components/NutritionMealCard'
import { NutritionSummary } from '../components/NutritionSummary'
import { useNutritionDay } from '../hooks/useNutritionDay'

export function NutritionPage() {
  const {
    data,
    error,
    isLoading,
    clearMealEntry,
  } = useNutritionDay()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro na nutrição</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando suas refeições...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN NUTRIÇÃO
        </p>
        <h1 className="mt-2 text-3xl font-black">Refeições de hoje</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre exatamente o que foi consumido. O planejamento não conta
          como adesão.
        </p>
      </header>

      {data.pendingCount > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertTriangle
              className="shrink-0 text-amber-300"
              size={22}
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">
                {data.pendingCount}{' '}
                {data.pendingCount === 1
                  ? 'refeição pendente'
                  : 'refeições pendentes'}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Resolva cada pendência como consumida, parcial, substituída
                ou não realizada.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <NutritionSummary summary={data.summary} />

      <section>
        <SectionTitle
          title="Linha do dia"
          supportingText={`${data.meals.length} refeições`}
        />

        <div className="space-y-3">
          {data.meals.map((meal) => (
            <NutritionMealCard
              key={meal.id}
              meal={meal}
              onReset={clearMealEntry}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
