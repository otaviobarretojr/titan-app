import { Card, ProgressBar } from '../../../shared/ui'
import type { NutritionDaySummary } from '../types/nutrition'

type NutritionSummaryProps = {
  summary: NutritionDaySummary
}

function getPercentage(value: number, target: number) {
  if (target <= 0) return 0
  return Math.round((value / target) * 100)
}

export function NutritionSummary({
  summary,
}: NutritionSummaryProps) {
  return (
    <Card elevated>
      <h2 className="text-lg font-bold">Resumo nutricional</h2>

      <div className="mt-5 space-y-5">
        <ProgressBar
          label={`${summary.caloriesConsumedKcal.toLocaleString(
            'pt-BR',
          )} de ${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`}
          value={getPercentage(
            summary.caloriesConsumedKcal,
            summary.calorieTargetKcal,
          )}
        />

        <ProgressBar
          label={`${summary.proteinConsumedG} de ${summary.proteinTargetG} g de proteína`}
          value={getPercentage(
            summary.proteinConsumedG,
            summary.proteinTargetG,
          )}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-slate-500">Carboidratos</p>
          <p className="mt-1 font-bold">
            {summary.carbohydrateConsumedG} g
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-slate-500">Gorduras</p>
          <p className="mt-1 font-bold">{summary.fatConsumedG} g</p>
        </div>
      </div>
    </Card>
  )
}
