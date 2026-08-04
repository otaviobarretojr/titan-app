import { getTitanLocalDate } from '../../../database/date'
import { titanDatabase, type BodyMetricRecord, type ProgressPhotoRecord } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { BioimpedanceInput, BodyMetric, BodyMetricInput, EvolutionSummary, PhotoPose } from '../types/evolution'
import { averageInWindow, calculateCardioMetrics, calculateVariation, comparePeriods, weightTrend } from '../utils/evolutionMath'
import { validateBioimpedance, validateBodyMetric } from '../utils/evolutionValidation'
import { isQuotaError } from '../utils/photoProcessing'

const legacy = (record: BodyMetricRecord): BodyMetric => ({
  id: record.id, localDate: record.localDate, weightKg: record.weightKg, waistCm: record.waistCm,
  rightArmCm: record.rightArmCm ?? record.armCm, leftArmCm: record.leftArmCm ?? record.armCm,
  chestCm: record.chestCm, rightThighCm: record.rightThighCm ?? record.thighCm, leftThighCm: record.leftThighCm ?? record.thighCm,
  rightCalfCm: record.rightCalfCm ?? record.calfCm, leftCalfCm: record.leftCalfCm ?? record.calfCm,
  hipCm: record.hipCm ?? null, neckCm: record.neckCm ?? null, bodyFatPercentage: record.bodyFatPercentage, notes: record.notes,
})

export async function getEvolutionSummary(): Promise<EvolutionSummary> {
  const [rawMetrics, photos, bio, sets, plans, cardio] = await Promise.all([
    titanDatabase.bodyMetrics.where('userId').equals(TITAN_USER_ID).toArray(),
    titanDatabase.progressPhotos.where('userId').equals(TITAN_USER_ID).toArray(),
    titanDatabase.bioimpedance.where('userId').equals(TITAN_USER_ID).toArray(),
    titanDatabase.exerciseSets.where('userId').equals(TITAN_USER_ID).toArray(),
    titanDatabase.exercisePlans.where('userId').equals(TITAN_USER_ID).toArray(),
    titanDatabase.cardioSessions.where('userId').equals(TITAN_USER_ID).toArray(),
  ])
  const entries = rawMetrics.map(legacy).sort((a, b) => b.localDate.localeCompare(a.localDate))
  const points = entries.map((item) => ({ localDate: item.localDate, value: item.weightKg }))
  const end = getTitanLocalDate()
  const waistEntries = entries.filter((item) => item.waistCm !== null)
  const planNames = new Map(plans.map((plan) => [plan.id, plan.name]))
  const strength = new Map<string, { exerciseName: string; estimatedOneRepMaxKg: number; localDate: string; volumeKg: number }>()
  sets.forEach((set) => {
    const name = planNames.get(set.exercisePlanId)
    if (!name) return
    const rm = set.loadKg * (1 + set.repetitions / 30)
    const current = strength.get(name)
    const volumeKg = set.loadKg * set.repetitions
    if (!current || rm > current.estimatedOneRepMaxKg) strength.set(name, { exerciseName: name, estimatedOneRepMaxKg: rm, localDate: set.localDate, volumeKg })
  })
  const cardioMetrics = calculateCardioMetrics(cardio.filter((x) => x.status === 'completed'), end, 7)
  return {
    latestWeightKg: entries[0]?.weightKg ?? null, previousWeightKg: entries[1]?.weightKg ?? null,
    weightVariationKg: calculateVariation(entries[0]?.weightKg ?? null, entries[1]?.weightKg ?? null),
    weeklyAverageKg: averageInWindow(points, end, 7), weeklyWeight: comparePeriods(points, end, 7), monthlyWeight: comparePeriods(points, end, 30), weightTrend: weightTrend(points.slice(0, 14)),
    latestWaistCm: waistEntries[0]?.waistCm ?? null, waistVariationCm: calculateVariation(waistEntries[0]?.waistCm ?? null, waistEntries[1]?.waistCm ?? null),
    latestBodyFatPercentage: bio.sort((a, b) => b.localDate.localeCompare(a.localDate)).find((x) => x.bodyFatPercentage !== null)?.bodyFatPercentage ?? entries.find((x) => x.bodyFatPercentage !== null)?.bodyFatPercentage ?? null,
    entries, bioimpedance: bio.sort((a, b) => b.localDate.localeCompare(a.localDate)),
    photos: photos.sort((a, b) => b.localDate.localeCompare(a.localDate)).map((p) => ({ id: p.id, localDate: p.localDate, imageDataUrl: p.imageDataUrl, pose: (p.pose === 'side' ? 'right-side' : p.pose === 'other' ? 'front' : p.pose) as PhotoPose, weightKg: p.weightKg ?? null, notes: p.notes })),
    trend: [...entries].reverse().slice(-30).map((item) => ({ localDate: item.localDate, weightKg: item.weightKg, waistCm: item.waistCm, movingAverage7Kg: averageInWindow(points, item.localDate, 7) })),
    bestStrengthRecords: [...strength.values()].sort((a, b) => b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg).slice(0, 6),
    cardioSummary: { completedSessions: cardioMetrics.sessions, totalMinutes: cardioMetrics.totalMinutes, totalDistanceKm: cardioMetrics.totalDistanceKm, averagePace: cardioMetrics.averagePace, bestPace: cardioMetrics.bestPace, longestDistanceKm: cardioMetrics.longestDistanceKm },
    coverage: { last7Days: 7, measuredDays: new Set(entries.filter((x) => (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${x.localDate}T00:00:00Z`)) / 86400000 < 7).map((x) => x.localDate)).size },
  }
}

export async function saveBodyMetric(input: BodyMetricInput) {
  validateBodyMetric(input)
  const localDate = getTitanLocalDate(), now = new Date().toISOString()
  const existing = await titanDatabase.bodyMetrics.where('[userId+localDate]').equals([TITAN_USER_ID, localDate]).first()
  await titanDatabase.bodyMetrics.put({ id: existing?.id ?? `body-metric-${crypto.randomUUID()}`, userId: TITAN_USER_ID, localDate, weightKg: input.weightKg, waistCm: input.waistCm, armCm: null, chestCm: input.chestCm, thighCm: null, calfCm: null, rightArmCm: input.rightArmCm, leftArmCm: input.leftArmCm, rightThighCm: input.rightThighCm, leftThighCm: input.leftThighCm, rightCalfCm: input.rightCalfCm, leftCalfCm: input.leftCalfCm, hipCm: input.hipCm, neckCm: input.neckCm, bodyFatPercentage: null, notes: input.notes.trim(), createdAt: existing?.createdAt ?? now, updatedAt: now })
}
export const deleteBodyMetric = (id: string) => titanDatabase.bodyMetrics.delete(id)
export async function saveBioimpedance(input: BioimpedanceInput) {
  validateBioimpedance(input); const now = new Date().toISOString()
  await titanDatabase.bioimpedance.add({ id: `bio-${crypto.randomUUID()}`, userId: TITAN_USER_ID, localDate: getTitanLocalDate(), ...input, equipment: input.equipment.trim(), conditions: input.conditions.trim(), notes: input.notes.trim(), createdAt: now, updatedAt: now })
}
export async function saveProgressPhoto(input: { imageDataUrl: string; pose: PhotoPose; weightKg: number | null; notes: string }) {
  if (!input.imageDataUrl.startsWith('data:image/webp')) throw new Error('A foto precisa ser otimizada antes de salvar.')
  if (input.weightKg !== null && (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 500)) throw new Error('Peso relacionado inválido.')
  const now = new Date().toISOString()
  try { await titanDatabase.progressPhotos.add({ id: `progress-photo-${crypto.randomUUID()}`, userId: TITAN_USER_ID, localDate: getTitanLocalDate(), ...input, createdAt: now, updatedAt: now } as ProgressPhotoRecord) }
  catch (error) { if (isQuotaError(error)) throw new Error('Armazenamento cheio. Exclua fotos antigas ou exporte um backup.', { cause: error }); throw error }
}
export const deleteProgressPhoto = (id: string) => titanDatabase.progressPhotos.delete(id)
