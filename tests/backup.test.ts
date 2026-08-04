import { describe, expect, it } from 'vitest'
import { readBackup } from '../src/services/backup/backupService'
import {
  sha256,
  stableStringify,
} from '../src/services/cloudBackup/backupSerializer'

function jsonFile(value: unknown) {
  return {
    text: async () => JSON.stringify(value),
  } as File
}

async function createValidBackup() {
  const tables = {
    users: [{ id: 'user' }],
  }

  const preferences = {}
  const recordCounts = {
    users: 1,
  }

  const compatibility = {
    minDatabaseVersion: 1,
    maxDatabaseVersion: 11,
    excludedTables: [],
    photosExcludedByDefault: true,
    automaticSync: false as const,
  }

  const checksum = await sha256(
    stableStringify({
      tables,
      preferences,
      recordCounts,
      compatibility,
    }),
  )

  return {
    format: 'titan-backup' as const,
    backupVersion: 3,
    databaseVersion: 11,
    appVersion: '0.9.0-rc.1',
    localUserId: 'user',
    exportedAt: '2026-08-04T00:00:00.000Z',
    deviceId: 'device-test',
    deviceName: 'Dispositivo de teste',
    checksum,
    tables,
    preferences,
    recordCounts,
    estimatedSizeBytes: 1024,
    containsPhotos: false,
    compatibility,
  }
}

describe('backup versionado', () => {
  it('rejeita formato antes de qualquer restauração', async () => {
    await expect(
      readBackup(
        jsonFile({
          format: 'titan-backup',
          backupVersion: 1,
        }),
      ),
    ).rejects.toThrow()
  })

  it('resume um backup válido antes da confirmação', async () => {
    const backup = await createValidBackup()

    const { summary } = await readBackup(
      jsonFile(backup),
    )

    expect(summary).toMatchObject({
      records: 1,
      tables: 1,
      databaseVersion: 11,
    })
  })
})
