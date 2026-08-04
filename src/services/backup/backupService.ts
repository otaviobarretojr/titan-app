import { z } from 'zod'
import { titanDatabase } from '../../database/titanDatabase'

const backupSchema = z.object({
  format: z.literal('titan-backup'),
  backupVersion: z.literal(2),
  exportedAt: z.string(),
  databaseVersion: z.number(),
  tables: z.record(z.string(), z.array(z.unknown())),
  localStorage: z.record(z.string(), z.string()),
})

export type TitanBackup = z.infer<typeof backupSchema>
export type BackupSummary = {
  exportedAt: string
  databaseVersion: number
  records: number
  tables: number
}

export async function readBackup(file: File): Promise<{ backup: TitanBackup; summary: BackupSummary }> {
  const parsed: unknown = JSON.parse(await file.text())
  const backup = backupSchema.parse(parsed)
  const existingTables = new Set(titanDatabase.tables.map((table) => table.name))
  for (const tableName of Object.keys(backup.tables)) {
    if (!existingTables.has(tableName)) throw new Error(`Tabela incompatível no backup: ${tableName}`)
  }
  return {
    backup,
    summary: {
      exportedAt: backup.exportedAt,
      databaseVersion: backup.databaseVersion,
      records: Object.values(backup.tables).reduce((total, records) => total + records.length, 0),
      tables: Object.keys(backup.tables).length,
    },
  }
}

function exportTitanLocalStorage() {
  const values: Record<string, string> = {}

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)

    if (!key || !key.startsWith('titan-')) continue

    const value = localStorage.getItem(key)

    if (value !== null) {
      values[key] = value
    }
  }

  return values
}

export async function createBackup(): Promise<TitanBackup> {
  const tables: Record<string, unknown[]> = {}

  for (const table of titanDatabase.tables) {
    tables[table.name] = await table.toArray()
  }

  return {
    format: 'titan-backup',
    backupVersion: 2,
    exportedAt: new Date().toISOString(),
    databaseVersion: titanDatabase.verno,
    tables,
    localStorage: exportTitanLocalStorage(),
  }
}

export async function downloadBackup() {
  const backup = await createBackup()
  const content = JSON.stringify(backup, null, 2)
  const blob = new Blob([content], {
    type: 'application/json',
  })
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

  await titanDatabase.transaction(
    'rw',
    titanDatabase.tables,
    async () => {
      for (const table of titanDatabase.tables) {
        await table.clear()

        const records = backup.tables[table.name] ?? []

        if (records.length > 0) {
          await table.bulkAdd(records)
        }
      }
    },
  )

  for (const [key, value] of Object.entries(backup.localStorage)) {
    localStorage.setItem(key, value)
  }
}
