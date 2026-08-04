import { z } from 'zod'
import { titanDatabase } from '../../database/titanDatabase'
import { CLOUD_BACKUP_MAX_BYTES, CLOUD_BACKUP_VERSION, sha256, stableStringify, type TitanCloudBackup } from './backupSerializer'

const backupSchema: z.ZodType<TitanCloudBackup> = z.object({
  format: z.literal('titan-backup'), backupVersion: z.number(), databaseVersion: z.number(), appVersion: z.string(), localUserId: z.string(), exportedAt: z.string(), deviceId: z.string(), deviceName: z.string(), checksum: z.string().min(16), tables: z.record(z.string(), z.array(z.unknown())), preferences: z.record(z.string(), z.string()), recordCounts: z.record(z.string(), z.number().int().nonnegative()), estimatedSizeBytes: z.number().nonnegative(), containsPhotos: z.boolean(), compatibility: z.object({ minDatabaseVersion: z.number(), maxDatabaseVersion: z.number(), excludedTables: z.array(z.string()), photosExcludedByDefault: z.boolean(), automaticSync: z.literal(false) }),
})

export type BackupValidationResult = { ok: true; backup: TitanCloudBackup } | { ok: false; message: string }

export async function validateBackupPayload(input: unknown): Promise<BackupValidationResult> {
  const parsed = backupSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'O arquivo de backup está incompleto ou usa um formato inválido.' }
  const backup = parsed.data
  if (backup.backupVersion > CLOUD_BACKUP_VERSION) return { ok: false, message: 'Este backup foi criado por uma versão mais nova do TITAN.' }
  if (backup.databaseVersion > titanDatabase.verno || backup.compatibility.maxDatabaseVersion > titanDatabase.verno) return { ok: false, message: 'Backup incompatível com a versão atual do banco local.' }
  const existingTables = new Set(titanDatabase.tables.map((table) => table.name))
  for (const [name, records] of Object.entries(backup.tables)) {
    if (!existingTables.has(name)) return { ok: false, message: `Tabela incompatível no backup: ${name}.` }
    if (backup.recordCounts[name] !== records.length) return { ok: false, message: `Contagem divergente na tabela ${name}.` }
  }
  const bytes = new Blob([JSON.stringify(backup)]).size
  if (bytes > CLOUD_BACKUP_MAX_BYTES) return { ok: false, message: 'Backup maior que o limite seguro configurado.' }
  const expected = await sha256(stableStringify({ tables: backup.tables, preferences: backup.preferences, recordCounts: backup.recordCounts, compatibility: backup.compatibility }))
  if (expected !== backup.checksum) return { ok: false, message: 'A verificação de integridade falhou. O backup pode estar corrompido.' }
  return { ok: true, backup }
}

export async function parseAndValidateBackupText(text: string): Promise<BackupValidationResult> {
  try { return validateBackupPayload(JSON.parse(text)) } catch { return { ok: false, message: 'Não foi possível ler o JSON do backup.' } }
}
