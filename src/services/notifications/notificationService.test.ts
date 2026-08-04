import { describe, expect, it, vi } from 'vitest'
import { getNotificationPermission, notificationsSupported } from './notificationService'

describe('notificationService permission states', () => {
  it('retorna unsupported sem Notification API', () => { vi.stubGlobal('Notification', undefined); expect(notificationsSupported()).toBe(false); expect(getNotificationPermission()).toBe('unsupported'); vi.unstubAllGlobals() })
  it('reflete permissão negada sem solicitar automaticamente', () => { vi.stubGlobal('Notification', { permission: 'denied' }); expect(getNotificationPermission()).toBe('denied'); vi.unstubAllGlobals() })
})
