import { beforeEach, describe, expect, it, vi } from 'vitest'

const values = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
})

import { getReminderPreferences, notificationsEnabled, setNotificationsEnabled } from '../src/services/notifications/notificationService'

describe('preferências de notificações', () => {
  beforeEach(() => values.clear())

  it('persiste a chave mestre', () => {
    setNotificationsEnabled(true)
    expect(notificationsEnabled()).toBe(true)
  })

  it('oferece todas as categorias da central', () => {
    expect(getReminderPreferences().map(({ id }) => id)).toEqual([
      'meal', 'hydration', 'workout', 'preWorkout', 'dailySummary', 'weeklySummary', 'sleep',
    ])
  })
})
