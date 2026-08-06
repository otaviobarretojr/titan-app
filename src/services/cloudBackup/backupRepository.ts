import { titanDatabase } from '../../database/titanDatabase'
import { serializeBackup, type TitanCloudBackup } from './backupSerializer'
import { validateBackupPayload } from './backupValidator'

export async function createLocalSafetySnapshot(): Promise<TitanCloudBackup> { return serializeBackup({ includePhotos: false }) }

export async function getLocalRecordCounts() {
  const counts: Record<string, number> = {}
  for (const table of titanDatabase.tables) counts[table.name] = await table.count()
  return counts
}

export async function replaceLocalDataFromBackup(backup: TitanCloudBackup) {
  const validation = await validateBackupPayload(backup)
  if (!validation.ok) throw new Error(validation.message)
  const snapshot = await createLocalSafetySnapshot()
  localStorage.setItem(`titan-restore-snapshot-${new Date().toISOString()}`, JSON.stringify(snapshot))
  await titanDatabase.transaction('rw', titanDatabase.tables, async () => {
    for (const table of titanDatabase.tables) {
      // v1.0.3 backups have no nutrition tables: keep the current foundation.
      // Official library rows reconcile by stable ID; custom rows are restored
      // alongside them without duplicating the curated library.
      if (!(table.name in backup.tables)) continue
      const records = backup.tables[table.name] ?? []
      if (table.name === 'foodLibrary' || table.name === 'nutritionDataSources') {
        if (records.length > 0) await table.bulkPut(records)
      } else {
        await table.clear()
        if (records.length > 0) await table.bulkAdd(records)
      }
    }
  })
  for (const [key, value] of Object.entries(backup.preferences)) localStorage.setItem(key, value)
  return { snapshotChecksum: snapshot.checksum }
}
