import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type HealthExamRecord,
  type HealthMetricRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { HealthSummary } from '../types/health'

export async function getHealthSummary(): Promise<HealthSummary> {
  const [metrics, exams] = await Promise.all([
    titanDatabase.healthMetrics
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
    titanDatabase.healthExams
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
  ])

  const sortedMetrics = [...metrics].sort((a, b) =>
    b.localDate.localeCompare(a.localDate),
  )

  const heartRateValues = sortedMetrics
    .map((item) => item.restingHeartRate)
    .filter((value): value is number => value !== null)

  return {
    latestMetric: sortedMetrics[0]
      ? {
          id: sortedMetrics[0].id,
          localDate: sortedMetrics[0].localDate,
          systolicPressure: sortedMetrics[0].systolicPressure,
          diastolicPressure: sortedMetrics[0].diastolicPressure,
          restingHeartRate: sortedMetrics[0].restingHeartRate,
          symptom: sortedMetrics[0].symptom,
          notes: sortedMetrics[0].notes,
        }
      : null,
    metrics: sortedMetrics.map((item) => ({
      id: item.id,
      localDate: item.localDate,
      systolicPressure: item.systolicPressure,
      diastolicPressure: item.diastolicPressure,
      restingHeartRate: item.restingHeartRate,
      symptom: item.symptom,
      notes: item.notes,
    })),
    exams: [...exams]
      .sort((a, b) => b.examDate.localeCompare(a.examDate))
      .map((item) => ({
        id: item.id,
        examDate: item.examDate,
        title: item.title,
        category: item.category,
        value: item.value,
        referenceRange: item.referenceRange,
        notes: item.notes,
      })),
    averageRestingHeartRate:
      heartRateValues.length > 0
        ? Math.round(
            heartRateValues.reduce((sum, value) => sum + value, 0) /
              heartRateValues.length,
          )
        : null,
  }
}

export async function saveHealthMetric(input: {
  systolicPressure: number | null
  diastolicPressure: number | null
  restingHeartRate: number | null
  symptom: string
  notes: string
}) {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  if (
    input.systolicPressure !== null &&
    (input.systolicPressure < 50 || input.systolicPressure > 300)
  ) {
    throw new Error('Pressão sistólica inválida.')
  }

  if (
    input.diastolicPressure !== null &&
    (input.diastolicPressure < 30 || input.diastolicPressure > 200)
  ) {
    throw new Error('Pressão diastólica inválida.')
  }

  if (
    input.restingHeartRate !== null &&
    (input.restingHeartRate < 25 || input.restingHeartRate > 250)
  ) {
    throw new Error('Frequência cardíaca inválida.')
  }

  const existing = await titanDatabase.healthMetrics
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  const record: HealthMetricRecord = {
    id: existing?.id ?? `health-metric-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate,
    systolicPressure: input.systolicPressure,
    diastolicPressure: input.diastolicPressure,
    restingHeartRate: input.restingHeartRate,
    symptom: input.symptom.trim(),
    notes: input.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.healthMetrics.put(record)
}

export async function deleteHealthMetric(id: string) {
  await titanDatabase.healthMetrics.delete(id)
}

export async function saveHealthExam(input: {
  examDate: string
  title: string
  category: string
  value: string
  referenceRange: string
  notes: string
}) {
  if (!input.examDate || !input.title.trim()) {
    throw new Error('Data e nome do exame são obrigatórios.')
  }

  const now = new Date().toISOString()

  const record: HealthExamRecord = {
    id: `health-exam-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    examDate: input.examDate,
    title: input.title.trim(),
    category: input.category.trim(),
    value: input.value.trim(),
    referenceRange: input.referenceRange.trim(),
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.healthExams.add(record)
}

export async function deleteHealthExam(id: string) {
  await titanDatabase.healthExams.delete(id)
}
