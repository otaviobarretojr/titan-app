import { describe, expect, it } from 'vitest'
import { CLOUD_BACKUP_VERSION, sha256, stableStringify, type TitanCloudBackup } from './backupSerializer'
import { validateBackupPayload } from './backupValidator'

async function backup(overrides: Partial<TitanCloudBackup> = {}): Promise<TitanCloudBackup> {
  const core = { tables: { users: [] }, preferences: {}, recordCounts: { users: 0 }, compatibility: { minDatabaseVersion: 1, maxDatabaseVersion: 11, excludedTables: ['progressPhotos'], photosExcludedByDefault: true, automaticSync: false as const } }
  return { format: 'titan-backup', backupVersion: CLOUD_BACKUP_VERSION, databaseVersion: 11, appVersion: 'test', localUserId: 'local-user', exportedAt: new Date().toISOString(), deviceId: 'ABCD', deviceName: 'Dispositivo ABCD', checksum: await sha256(stableStringify(core)), estimatedSizeBytes: 100, containsPhotos: false, ...core, ...overrides }
}

describe('cloud backup validator', () => {
  it('accepts a compatible Dexie 11 backup without photos by default', async () => {
    const result = await validateBackupPayload(await backup())
    expect(result.ok).toBe(true)
  })
  it('rejects corrupted checksum before restore', async () => {
    const result = await validateBackupPayload(await backup({ checksum: 'corrupted-checksum' }))
    expect(result.ok).toBe(false)
  })
  it('rejects incompatible future database versions', async () => {
    const result = await validateBackupPayload(await backup({ databaseVersion: 99 }))
    expect(result.ok).toBe(false)
  })
  it('rejects incomplete record counts', async () => {
    const result = await validateBackupPayload(await backup({ recordCounts: { users: 2 } }))
    expect(result.ok).toBe(false)
  })
})
