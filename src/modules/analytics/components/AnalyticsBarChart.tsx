import { Card } from '../../../shared/ui'
import type { AnalyticsPoint } from '../types/analytics'
import { normalize } from '../utils/analyticsMath'

type AnalyticsBarChartProps = {
  title: string
  points: AnalyticsPoint[]
  selector: (point: AnalyticsPoint) => number
  suffix: string
}

export function AnalyticsBarChart({
  title,
  points,
  selector,
  suffix,
}: AnalyticsBarChartProps) {
  const visiblePoints = points.slice(-14)
  const values = visiblePoints.map(selector)
  const minimum = Math.min(...values, 0)
  const maximum = Math.max(...values, 1)

  return (
    <Card>
      <h2 className="text-lg font-bold">{title}</h2>

      <div className="mt-6 flex h-44 items-end gap-1">
        {visiblePoints.map((point) => {
          const value = selector(point)
          const height =
            value <= 0
              ? 3
              : 20 + normalize(value, minimum, maximum) * 0.8

          return (
            <div
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={point.localDate}
              title={`${point.localDate}: ${value} ${suffix}`}
            >
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{ height: `${height}%` }}
              />
              <span className="text-[8px] text-slate-600">
                {point.localDate.slice(8)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
