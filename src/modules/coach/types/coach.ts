export type CoachPriority = 'high' | 'medium' | 'low'
export type CoachCategory =
  | 'nutrition' | 'hydration' | 'training' | 'cardio'
  | 'recovery' | 'body' | 'consistency' | 'evolution'
export type TrendMetric =
  | 'protein' | 'calories' | 'hydration' | 'sleep' | 'weight'
  | 'waist' | 'training' | 'trainingVolume' | 'strength' | 'cardio' | 'score'
export type TrendPeriod = 'weekly' | 'monthly' | 'quarterly'

export type CoachInsight = {
  id: string
  category: CoachCategory
  priority: CoachPriority
  title: string
  message: string
  evidence: string
  period: string
  sampleSize: number
  actionLabel: string
  actionPath: string
  generatedAt: string
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
  metric: TrendMetric
  period: TrendPeriod
  title: string
  direction: 'up' | 'down' | 'stable'
  changePercent: number | null
  currentAverage: number
  previousAverage: number | null
  unit: string
  message: string
  sampleSize: number
  previousSampleSize: number
}
export type CoachDataCoverage = {
  measured: number
  total: number
  missing: CoachCategory[]
  daysWithAnyData: number
  periodDays: number
  byMetric: Array<{ metric: TrendMetric; samples: number }>
}
export type RecommendationHistory = {
  id: string
  localDate: string
  title: string
  priority: CoachPriority
  category: string
  evidence: string
  period: string
  sampleSize: number
  action: string
  actionPath?: string
}
export type CoachReport = {
  generatedAt: string
  dailyInsights: CoachInsight[]
  weeklyTrends: CoachTrend[]
  monthlyTrends: CoachTrend[]
  quarterlyTrends: CoachTrend[]
  score: TitanScore
  executiveSummary: string
  weeklySummary: string
  monthlySummary: string
  coverage: CoachDataCoverage
  history: RecommendationHistory[]
  timeline: TitanTimelineEvent[]
}

export type TitanTimelineEventType = 'workout' | 'record' | 'protein' | 'hydration' | 'weight' | 'photo' | 'coach'
export type TitanTimelineEvent = { id: string; type: TitanTimelineEventType; title: string; occurredAt: string; localDate: string; detail: string }
export type TitanTimelineGroup = 'Hoje' | 'Ontem' | 'Últimos 7 dias' | 'Últimos 30 dias'
