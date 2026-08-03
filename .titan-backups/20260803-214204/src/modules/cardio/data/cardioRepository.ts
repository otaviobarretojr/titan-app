import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type CardioSessionRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { CardioDay } from '../types/cardio'

export async function getCardioDay(): Promise<CardioDay | null> {
  const localDate = getTitanLocalDate()

  const plan = await titanDatabase.cardioPlans
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  if (!plan) return null

  const session = await titanDatabase.cardioSessions
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((item) => item.cardioPlanId === plan.id)
    .first()

  return {
    id: plan.id,
    title: plan.title,
    type: plan.type,
    plannedTime: plan.plannedTime,
    targetDurationMinutes: plan.targetDurationMinutes,
    targetDistanceKm: plan.targetDistanceKm,
    status: session?.status ?? 'planned',
    sessionId: session?.id ?? null,
    durationMinutes: session?.durationMinutes ?? plan.targetDurationMinutes,
    distanceKm: session?.distanceKm ?? plan.targetDistanceKm,
    averageHeartRate: session?.averageHeartRate ?? null,
    perceivedEffort: session?.perceivedEffort ?? 5,
    notes: session?.notes ?? '',
  }
}

export async function startCardio(cardioPlanId: string) {
  const localDate = getTitanLocalDate()

  const existing = await titanDatabase.cardioSessions
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((item) => item.cardioPlanId === cardioPlanId)
    .first()

  if (existing) return existing.id

  const now = new Date().toISOString()

  const session: CardioSessionRecord = {
    id: `cardio-session-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    cardioPlanId,
    localDate,
    status: 'started',
    durationMinutes: 0,
    distanceKm: null,
    averageHeartRate: null,
    perceivedEffort: 5,
    notes: '',
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.cardioSessions.add(session)
  return session.id
}

export async function completeCardio(input: {
  sessionId: string
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  notes: string
}) {
  if (input.durationMinutes <= 0) {
    throw new Error('A duração deve ser maior que zero.')
  }

  if (input.perceivedEffort < 1 || input.perceivedEffort > 10) {
    throw new Error('O esforço percebido deve ficar entre 1 e 10.')
  }

  const session = await titanDatabase.cardioSessions.get(input.sessionId)

  if (!session) {
    throw new Error('Sessão de cardio não encontrada.')
  }

  const now = new Date().toISOString()

  await titanDatabase.cardioSessions.update(input.sessionId, {
    status: 'completed',
    durationMinutes: input.durationMinutes,
    distanceKm: input.distanceKm,
    averageHeartRate: input.averageHeartRate,
    perceivedEffort: input.perceivedEffort,
    notes: input.notes.trim(),
    completedAt: now,
    updatedAt: now,
  })
}

export async function resetCardio(sessionId: string) {
  await titanDatabase.cardioSessions.delete(sessionId)
}
