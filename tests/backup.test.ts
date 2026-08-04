import { describe, expect, it } from 'vitest'
import { readBackup } from '../src/services/backup/backupService'

function jsonFile(value: unknown) {
  return { text: async () => JSON.stringify(value) } as File
}

describe('backup versionado', () => {
  it('rejeita formato antes de qualquer restauração', async () => {
    await expect(readBackup(jsonFile({ format: 'titan-backup', backupVersion: 1 }))).rejects.toThrow()
  })

  it('resume um backup válido antes da confirmação', async () => {
    const { summary } = await readBackup(jsonFile({
      format: 'titan-backup', backupVersion: 2, exportedAt: '2026-08-04T00:00:00.000Z',
      databaseVersion: 9, tables: { users: [{ id: 'user' }] }, localStorage: {},
    }))
    expect(summary).toMatchObject({ records: 1, tables: 1, databaseVersion: 9 })
  })
})
