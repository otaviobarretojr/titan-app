import { Droplets, Plus } from 'lucide-react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import type { NutritionDaySummary } from '../types/nutrition'
import {
  calculateRemainingMacros,
  getMacroPercentage,
} from '../utils/nutritionMath'

type NutritionSummaryProps = {
  summary: NutritionDaySummary
  onAddWater: (amountMl: number) => Promise<unknown>
}

export function NutritionSummary({
  summary,
  onAddWater,
}: NutritionSummaryProps) {
  const remaining = calculateRemainingMacros({
    caloriesConsumedKcal: summary.caloriesConsumedKcal,
    calorieTargetKcal: summary.calorieTargetKcal,
    proteinConsumedG: summary.proteinConsumedG,
    proteinTargetG: summary.proteinTargetG,
  })

  return (
    <Card elevated>
      <h2 className="text-lg font-bold">Resumo nutricional</h2>

      <div className="mt-5 space-y-5">
        <ProgressBar
          label={`${summary.caloriesConsumedKcal.toLocaleString(
            'pt-BR',
          )} de ${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`}
          value={getMacroPercentage(
            summary.caloriesConsumedKcal,
            summary.calorieTargetKcal,
          )}
        />

        <ProgressBar
          label={`${summary.proteinConsumedG} de ${summary.proteinTargetG} g de proteína`}
          value={getMacroPercentage(
            summary.proteinConsumedG,
            summary.proteinTargetG,
          )}
        />

        <ProgressBar
          label={`${(summary.hydrationConsumedMl / 1000).toLocaleString(
            'pt-BR',
            { maximumFractionDigits: 1 },
          )} de ${(summary.hydrationTargetMl / 1000).toLocaleString(
            'pt-BR',
            { maximumFractionDigits: 1 },
          )} L de água`}
          value={getMacroPercentage(
            summary.hydrationConsumedMl,
            summary.hydrationTargetMl,
          )}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric
          label="Calorias restantes"
          value={`${remaining.caloriesRemainingKcal.toLocaleString(
            'pt-BR',
          )} kcal`}
        />
        <Metric
          label="Proteína restante"
          value={`${remaining.proteinRemainingG} g`}
        />
        <Metric
          label="Carboidratos"
          value={`${summary.carbohydrateConsumedG} g`}
        />
        <Metric
          label="Gorduras"
          value={`${summary.fatConsumedG} g`}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[300, 500, 750].map((amount) => (
          <Button
            key={amount}
            onClick={() => onAddWater(amount)}
            variant="ghost"
          >
            <Plus size={16} aria-hidden="true" />
            {amount} ml
          </Button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Droplets size={16} aria-hidden="true" />
        Registros de água atualizam o Dashboard e o Coach.
      </div>
    </Card>
  )
}

type MetricProps = {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  )
}
