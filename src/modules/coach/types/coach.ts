export type CoachPriority = 'high' | 'medium' | 'low'
export type CoachCategory =
  | 'nutrition'
  | 'hydration'
  | 'training'
  | 'cardio'
  | 'recovery'
  | 'consistency'

export type CoachInsight = {
  id: string
  category: CoachCategory
  priority: CoachPriority
  title: string
  message: string
  evidence: string
  actionLabel?: string
  actionPath?: string
}

export type TitanScoreBreakdown = {
  nutrition: number
  hydration: number
  training: number
  cardio: number
  recovery: number
  consistency: number
}

export type TitanScore = {
  value: number | null
  label: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' | 'Sem dados'
  breakdown: TitanScoreBreakdown
  measuredCategories: CoachCategory[]
}

export type CoachTrend = {
  id: string
  title: string
  direction: 'up' | 'down' | 'stable'
  message: string
  sampleSize: number
}

export type CoachDataCoverage = {
  measured: number
  total: number
  missing: CoachCategory[]
}

export type CoachReport = {
  generatedAt: string
  dailyInsights: CoachInsight[]
  weeklyTrends: CoachTrend[]
  score: TitanScore
  executiveSummary: string
  coverage: CoachDataCoverage
}
