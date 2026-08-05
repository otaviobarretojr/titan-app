import { titanDatabase } from '../../database/titanDatabase'
import { getDeviceIdentity } from './deviceIdentityService'

export const CLOUD_BACKUP_VERSION = 3
export const CLOUD_BACKUP_MAX_BYTES = 25 * 1024 * 1024
const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.3'
const PHOTO_TABLES = new Set(['progressPhotos'])

export type BackupTables = Record<string, unknown[]>
export type BackupRecordCounts = Record<string, number>
export type TitanCloudBackup = {
  format: 'titan-backup'
  backupVersion: number
  databaseVersion: number
  appVersion: string
  localUserId: string
  exportedAt: string
  deviceId: string
  deviceName: string
  checksum: string
  tables: BackupTables
  preferences: Record<string, string>
  recordCounts: BackupRecordCounts
  estimatedSizeBytes: number
  containsPhotos: boolean
  compatibility: {
    minDatabaseVersion: number
    maxDatabaseVersion: number
    excludedTables: string[]
    photosExcludedByDefault: boolean
    automaticSync: false
  }
}

export type BackupSummary = {
  exportedAt: string
  databaseVersion: number
  records: number
  tables: number
  sizeBytes: number
  containsPhotos: boolean
  checksum: string
  deviceName: string
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

export async function sha256(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function exportTitanPreferences() {
  const preferences: Record<string, string> = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key || !key.startsWith('titan-')) continue
    const value = localStorage.getItem(key)
    if (value !== null) preferences[key] = value
  }
  return preferences
}

export async function serializeBackup(options: { includePhotos?: boolean } = {}): Promise<TitanCloudBackup> {
  const device = getDeviceIdentity()
  const tables: BackupTables = {}
  const recordCounts: BackupRecordCounts = {}
  let containsPhotos = false

  for (const table of titanDatabase.tables) {
    if (PHOTO_TABLES.has(table.name) && !options.includePhotos) {
      tables[table.name] = []
      recordCounts[table.name] = 0
      containsPhotos = containsPhotos || (await table.count()) > 0
      continue
    }
    const records = await table.toArray()
    tables[table.name] = records
    recordCounts[table.name] = records.length
    if (PHOTO_TABLES.has(table.name) && records.length > 0) containsPhotos = true
  }

  const base = {
    format: 'titan-backup' as const,
    backupVersion: CLOUD_BACKUP_VERSION,
    databaseVersion: titanDatabase.verno,
    appVersion: APP_VERSION,
    localUserId: 'local-user',
    exportedAt: new Date().toISOString(),
    deviceId: device.id,
    deviceName: device.name,
    checksum: '',
    tables,
    preferences: exportTitanPreferences(),
    recordCounts,
    estimatedSizeBytes: 0,
    containsPhotos,
    compatibility: { minDatabaseVersion: 1, maxDatabaseVersion: 12, excludedTables: options.includePhotos ? [] : ['progressPhotos'], photosExcludedByDefault: !options.includePhotos, automaticSync: false as const },
  }
  const checksum = await sha256(stableStringify({ tables: base.tables, preferences: base.preferences, recordCounts: base.recordCounts, compatibility: base.compatibility }))
  const withChecksum = { ...base, checksum }
  return { ...withChecksum, estimatedSizeBytes: new Blob([JSON.stringify(withChecksum)]).size }
}

export function summarizeBackup(backup: TitanCloudBackup): BackupSummary {
  return { exportedAt: backup.exportedAt, databaseVersion: backup.databaseVersion, records: Object.values(backup.recordCounts).reduce((sum, count) => sum + count, 0), tables: Object.keys(backup.tables).length, sizeBytes: backup.estimatedSizeBytes, containsPhotos: backup.containsPhotos, checksum: backup.checksum, deviceName: backup.deviceName }
}
