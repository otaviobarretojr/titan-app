import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type BodyMetricRecord,
  type ProgressPhotoRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { EvolutionSummary } from '../types/evolution'
import {
  calculateAverage,
  calculateVariation,
} from '../utils/evolutionMath'

export async function getEvolutionSummary(): Promise<EvolutionSummary> {
  const [metrics, photos, personalRecords, cardioSessions] =
    await Promise.all([
      titanDatabase.bodyMetrics
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
      titanDatabase.progressPhotos
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
      titanDatabase.exercisePersonalRecords
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
      titanDatabase.cardioSessions
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
    ])

  const sortedMetrics = [...metrics].sort((a, b) =>
    b.localDate.localeCompare(a.localDate),
  )
  const latest = sortedMetrics[0] ?? null
  const previous = sortedMetrics[1] ?? null

  const lastSeven = sortedMetrics.slice(0, 7)

  const latestWithWaist = sortedMetrics.find(
    (item) => item.waistCm !== null,
  )
  const previousWithWaist = sortedMetrics
    .filter((item) => item.waistCm !== null)
    .at(1)

  const bestRecordByExercise = new Map<
    string,
    (typeof personalRecords)[number]
  >()

  for (const record of personalRecords) {
    const current = bestRecordByExercise.get(record.exerciseName)

    if (
      !current ||
      record.estimatedOneRepMaxKg > current.estimatedOneRepMaxKg
    ) {
      bestRecordByExercise.set(record.exerciseName, record)
    }
  }

  const completedCardio = cardioSessions.filter(
    (session) => session.status === 'completed',
  )

  return {
    latestWeightKg: latest?.weightKg ?? null,
    previousWeightKg: previous?.weightKg ?? null,
    weightVariationKg: calculateVariation(
      latest?.weightKg ?? null,
      previous?.weightKg ?? null,
    ),
    weeklyAverageKg: calculateAverage(
      lastSeven.map((item) => item.weightKg),
    ),
    latestWaistCm: latestWithWaist?.waistCm ?? null,
    waistVariationCm: calculateVariation(
      latestWithWaist?.waistCm ?? null,
      previousWithWaist?.waistCm ?? null,
    ),
    latestBodyFatPercentage:
      sortedMetrics.find((item) => item.bodyFatPercentage !== null)
        ?.bodyFatPercentage ?? null,
    entries: sortedMetrics,
    photos: [...photos]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((photo) => ({
        id: photo.id,
        localDate: photo.localDate,
        imageDataUrl: photo.imageDataUrl,
        pose: photo.pose,
        notes: photo.notes,
      })),
    trend: [...metrics]
      .sort((a, b) => a.localDate.localeCompare(b.localDate))
      .slice(-12)
      .map((item) => ({
        localDate: item.localDate,
        weightKg: item.weightKg,
        waistCm: item.waistCm,
      })),
    bestStrengthRecords: [...bestRecordByExercise.values()]
      .sort(
        (a, b) =>
          b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg,
      )
      .slice(0, 6)
      .map((record) => ({
        exerciseName: record.exerciseName,
        estimatedOneRepMaxKg: record.estimatedOneRepMaxKg,
        localDate: record.localDate,
      })),
    cardioSummary: {
      completedSessions: completedCardio.length,
      totalMinutes: completedCardio.reduce(
        (sum, item) => sum + item.durationMinutes,
        0,
      ),
      totalDistanceKm: completedCardio.reduce(
        (sum, item) => sum + (item.distanceKm ?? 0),
        0,
      ),
    },
  }
}

export async function saveBodyMetric(input: {
  weightKg: number
  waistCm: number | null
  armCm: number | null
  chestCm: number | null
  thighCm: number | null
  calfCm: number | null
  bodyFatPercentage: number | null
  notes: string
}) {
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    throw new Error('Peso inválido.')
  }

  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  const existing = await titanDatabase.bodyMetrics
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  const record: BodyMetricRecord = {
    id: existing?.id ?? `body-metric-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate,
    weightKg: input.weightKg,
    waistCm: input.waistCm,
    armCm: input.armCm,
    chestCm: input.chestCm,
    thighCm: input.thighCm,
    calfCm: input.calfCm,
    bodyFatPercentage: input.bodyFatPercentage,
    notes: input.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.bodyMetrics.put(record)
}

export async function deleteBodyMetric(id: string) {
  await titanDatabase.bodyMetrics.delete(id)
}

export async function saveProgressPhoto(input: {
  imageDataUrl: string
  pose: ProgressPhotoRecord['pose']
  notes: string
}) {
  if (!input.imageDataUrl.startsWith('data:image/')) {
    throw new Error('Imagem inválida.')
  }

  const now = new Date().toISOString()

  await titanDatabase.progressPhotos.add({
    id: `progress-photo-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate: getTitanLocalDate(),
    imageDataUrl: input.imageDataUrl,
    pose: input.pose,
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
  })
}

export async function deleteProgressPhoto(id: string) {
  await titanDatabase.progressPhotos.delete(id)
}
