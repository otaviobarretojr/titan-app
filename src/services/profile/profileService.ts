import { titanDatabase, type UserRecord } from '../../database/titanDatabase'

export async function saveProfile(input: Pick<UserRecord, 'id' | 'displayName'>) {
  const now = new Date().toISOString()
  const existing = await titanDatabase.users.get(input.id)
  const record: UserRecord = {
    id: input.id,
    displayName: input.displayName.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await titanDatabase.users.put(record)
  return record
}
