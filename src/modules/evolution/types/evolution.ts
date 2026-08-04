export type BodyMetric = {
  id: string; localDate: string; weightKg: number; waistCm: number | null
  rightArmCm: number | null; leftArmCm: number | null; chestCm: number | null
  rightThighCm: number | null; leftThighCm: number | null
  rightCalfCm: number | null; leftCalfCm: number | null
  hipCm: number | null; neckCm: number | null; bodyFatPercentage: number | null; notes: string
}
export type BodyMetricInput = Omit<BodyMetric, 'id' | 'localDate' | 'bodyFatPercentage'>
export type BioimpedanceInput = {
  bodyFatPercentage: number | null; muscleMassKg: number | null; leanMassKg: number | null
  visceralFat: number | null; bodyWaterPercentage: number | null; basalMetabolicRateKcal: number | null
  metabolicAge: number | null; equipment: string; conditions: string; notes: string
}
export type Bioimpedance = BioimpedanceInput & { id: string; localDate: string }
export type PhotoPose = 'front' | 'back' | 'right-side' | 'left-side'
export type ProgressPhoto = { id: string; localDate: string; imageDataUrl: string; pose: PhotoPose; weightKg: number | null; notes: string }
export type EvolutionTrendPoint = { localDate: string; weightKg: number; waistCm: number | null; movingAverage7Kg: number | null }
export type PeriodComparison = { currentAverage: number | null; previousAverage: number | null; variation: number | null; currentSamples: number; previousSamples: number }
export type EvolutionSummary = {
  latestWeightKg: number | null; previousWeightKg: number | null; weightVariationKg: number | null
  weeklyAverageKg: number | null; weeklyWeight: PeriodComparison; monthlyWeight: PeriodComparison
  weightTrend: 'gain' | 'loss' | 'stable' | 'insufficient'; latestWaistCm: number | null
  waistVariationCm: number | null; latestBodyFatPercentage: number | null
  entries: BodyMetric[]; bioimpedance: Bioimpedance[]; photos: ProgressPhoto[]; trend: EvolutionTrendPoint[]
  bestStrengthRecords: Array<{ exerciseName: string; estimatedOneRepMaxKg: number; localDate: string; volumeKg: number }>
  cardioSummary: { completedSessions: number; totalMinutes: number; totalDistanceKm: number; averagePace: number | null; bestPace: number | null; longestDistanceKm: number | null }
  coverage: { last7Days: number; measuredDays: number }
}
