import type { ReactNode } from 'react'
import { Card } from '../../../shared/ui'

type AnalyticsMetricCardProps = {
  icon: ReactNode
  label: string
  value: string
  supportingText?: string
}

export function AnalyticsMetricCard({
  icon,
  label,
  value,
  supportingText,
}: AnalyticsMetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-3 text-xl font-black">{value}</p>

      {supportingText ? (
        <p className="mt-1 text-xs text-slate-500">
          {supportingText}
        </p>
      ) : null}
    </Card>
  )
}
