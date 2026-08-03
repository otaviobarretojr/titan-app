import { z } from 'zod'
import { titanDatabase } from '../../database/titanDatabase'

const backupSchema = z.object({
  format: z.literal('titan-backup'),
  backupVersion: z.literal(1),
  exportedAt: z.string(),
  databaseVersion: z.number().int().positive(),
  tables: z.record(z.string(), z.array(z.unknown())),
})

export type TitanBackup = z.infer<typeof backupSchema>

export async function createBackup(): Promise<TitanBackup> {
  const tables: Record<string, unknown[]> = {}

  for (const table of titanDatabase.tables) {
    tables[table.name] = await table.toArray()
  }

  return {
    format: 'titan-backup',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    databaseVersion: titanDatabase.verno,
    tables,
  }
}

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
  const raw = await file.text()
  const parsed: unknown = JSON.parse(raw)
  const backup = backupSchema.parse(parsed)

  const existingTables = new Set(
    titanDatabase.tables.map((table) => table.name),
  )

  for (const tableName of Object.keys(backup.tables)) {
    if (!existingTables.has(tableName)) {
      throw new Error(`Tabela incompatível no backup: ${tableName}`)
    }
  }

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
}
