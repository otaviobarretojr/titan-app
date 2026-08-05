import { describe, expect, it } from 'vitest'
import { titanDatabase } from './titanDatabase'

describe('Dexie Sprint 014 schema', () => {
  it('inclui migração aditiva para preferências e inbox local', () => { expect(titanDatabase.verno).toBe(12); expect(titanDatabase.tables.map((table) => table.name)).toEqual(expect.arrayContaining(['notificationPreferences', 'notificationInbox'])) })
})
