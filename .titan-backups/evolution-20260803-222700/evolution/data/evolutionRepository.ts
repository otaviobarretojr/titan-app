import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type BodyMetricRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { EvolutionSummary } from '../types/evolution'

export async function getEvolutionSummary(): Promise<EvolutionSummary> {
  const entries = await titanDatabase.bodyMetrics
    .where('userId')
    .equals(TITAN_USER_ID)
    .reverse()
    .sortBy('localDate')

  const sorted = [...entries].sort((a, b) =>
    b.localDate.localeCompare(a.localDate),
  )

  const latest = sorted[0] ?? null
  const previous = sorted[1] ?? null

  const lastSeven = sorted.slice(0, 7)
  const weeklyAverageKg =
    lastSeven.length > 0
      ? lastSeven.reduce((total, item) => total + item.weightKg, 0) /
        lastSeven.length
      : null

  return {
    latestWeightKg: latest?.weightKg ?? null,
    previousWeightKg: previous?.weightKg ?? null,
    weightVariationKg:
      latest && previous ? latest.weightKg - previous.weightKg : null,
    weeklyAverageKg,
    entries: sorted,
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
