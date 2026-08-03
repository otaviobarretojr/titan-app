export type BodyMetric = {
  id: string
  localDate: string
  weightKg: number
  waistCm: number | null
  armCm: number | null
  chestCm: number | null
  thighCm: number | null
  calfCm: number | null
  bodyFatPercentage: number | null
  notes: string
}

export type ProgressPhoto = {
  id: string
  localDate: string
  imageDataUrl: string
  pose: 'front' | 'side' | 'back' | 'other'
  notes: string
}

export type EvolutionTrendPoint = {
  localDate: string
  weightKg: number
  waistCm: number | null
}

export type EvolutionSummary = {
  latestWeightKg: number | null
  previousWeightKg: number | null
  weightVariationKg: number | null
  weeklyAverageKg: number | null
  latestWaistCm: number | null
  waistVariationCm: number | null
  latestBodyFatPercentage: number | null
  entries: BodyMetric[]
  photos: ProgressPhoto[]
  trend: EvolutionTrendPoint[]
  bestStrengthRecords: Array<{
    exerciseName: string
    estimatedOneRepMaxKg: number
    localDate: string
  }>
  cardioSummary: {
    completedSessions: number
    totalMinutes: number
    totalDistanceKm: number
  }
}
