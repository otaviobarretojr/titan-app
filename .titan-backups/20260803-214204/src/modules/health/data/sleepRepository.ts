import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type SleepEntryRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'

export async function getTodaySleep() {
  const localDate = getTitanLocalDate()

  return titanDatabase.sleepEntries
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()
}

export async function saveTodaySleep(durationMinutes: number) {
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 24 * 60
  ) {
    throw new Error('Duração de sono inválida.')
  }

  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()
  const existing = await getTodaySleep()

  const record: SleepEntryRecord = {
    id: existing?.id ?? `sleep-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate,
    durationMinutes: Math.round(durationMinutes),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.sleepEntries.put(record)
}

export async function clearTodaySleep() {
  const existing = await getTodaySleep()

  if (existing) {
    await titanDatabase.sleepEntries.delete(existing.id)
  }
}
