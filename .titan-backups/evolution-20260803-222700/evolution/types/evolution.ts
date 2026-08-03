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

export type EvolutionSummary = {
  latestWeightKg: number | null
  previousWeightKg: number | null
  weightVariationKg: number | null
  weeklyAverageKg: number | null
  entries: BodyMetric[]
}
