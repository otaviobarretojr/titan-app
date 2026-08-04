import { titanDatabase } from '../../database/titanDatabase'
import { replaceLocalDataFromBackup } from '../cloudBackup/backupRepository'
import { serializeBackup, summarizeBackup, type BackupSummary, type TitanCloudBackup } from '../cloudBackup/backupSerializer'
import { parseAndValidateBackupText } from '../cloudBackup/backupValidator'

export type TitanBackup = TitanCloudBackup
export type { BackupSummary }

export async function readBackup(file: File): Promise<{ backup: TitanBackup; summary: BackupSummary }> {
  const validation = await parseAndValidateBackupText(await file.text())
  if (!validation.ok) throw new Error(validation.message)
  return { backup: validation.backup, summary: summarizeBackup(validation.backup) }
}

export async function createBackup(): Promise<TitanBackup> { return serializeBackup({ includePhotos: true }) }

export async function downloadBackup() {
  const backup = await createBackup()
  const content = JSON.stringify(backup, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = backup.exportedAt.slice(0, 10)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `titan-backup-${date}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function restoreBackup(file: File) {
  const { backup } = await readBackup(file)
  await replaceLocalDataFromBackup(backup)
}

export async function getBackupLocalCounts() {
  const counts: Record<string, number> = {}
  for (const table of titanDatabase.tables) counts[table.name] = await table.count()
  return counts
}
