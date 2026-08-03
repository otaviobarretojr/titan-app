export type CoachPriority = 'high' | 'medium' | 'low'

export type CoachInsight = {
  id: string
  priority: CoachPriority
  title: string
  message: string
  actionLabel?: string
  actionPath?: string
}

export type TitanScoreBreakdown = {
  nutrition: number
  hydration: number
  training: number
  cardio: number
  recovery: number
}

export type TitanScore = {
  value: number | null
  label: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' | 'Sem dados'
  breakdown: TitanScoreBreakdown
}
