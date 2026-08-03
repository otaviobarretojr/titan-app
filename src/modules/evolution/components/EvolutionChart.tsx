import { Card } from '../../../shared/ui'
import type { EvolutionTrendPoint } from '../types/evolution'
import { normalizeChartValue } from '../utils/evolutionMath'

type EvolutionChartProps = {
  trend: EvolutionTrendPoint[]
}

export function EvolutionChart({ trend }: EvolutionChartProps) {
  if (trend.length < 2) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Registre pelo menos duas medições para visualizar a tendência.
        </p>
      </Card>
    )
  }

  const weights = trend.map((item) => item.weightKg)
  const minimum = Math.min(...weights)
  const maximum = Math.max(...weights)

  return (
    <Card>
      <h2 className="text-lg font-bold">Tendência de peso</h2>

      <div className="mt-6 flex h-44 items-end gap-2">
        {trend.map((item) => {
          const normalized = normalizeChartValue(
            item.weightKg,
            minimum,
            maximum,
          )
          const height = 30 + normalized * 0.7

          return (
            <div
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={item.localDate}
            >
              <span className="text-[10px] font-bold text-slate-400">
                {item.weightKg.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1,
                })}
              </span>
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{ height: `${height}%` }}
              />
              <span className="text-[9px] text-slate-600">
                {item.localDate.slice(5).replace('-', '/')}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
