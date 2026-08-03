import { Badge } from '../../../shared/ui'
import type { MealStatus } from '../types/nutrition'

type MealStatusBadgeProps = {
  status: MealStatus
}

const statusConfig = {
  planned: { label: 'Planejada', tone: 'neutral' },
  pending: { label: 'Pendente', tone: 'warning' },
  partial: { label: 'Parcial', tone: 'warning' },
  completed: { label: 'Concluída', tone: 'success' },
  substituted: { label: 'Substituída', tone: 'primary' },
  skipped: { label: 'Não realizada', tone: 'neutral' },
} as const

export function MealStatusBadge({ status }: MealStatusBadgeProps) {
  const config = statusConfig[status]

  return <Badge tone={config.tone}>{config.label}</Badge>
}
