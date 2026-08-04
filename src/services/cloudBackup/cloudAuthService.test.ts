import { describe, expect, it, vi } from 'vitest'
import { clearCloudSession, getCloudConfig, requestEmailLogin } from './cloudAuthService'

describe('cloud auth degraded mode', () => {
  it('reports not configured without Supabase env vars', () => {
    expect(getCloudConfig().configured).toBe(false)
  })
  it('keeps local app usable by failing with a clear optional-cloud message', async () => {
    await expect(requestEmailLogin('user@example.com')).rejects.toThrow('não configurado')
  })
  it('clears expired local session safely', () => {
    vi.stubGlobal('localStorage', { removeItem: vi.fn(), getItem: vi.fn(), setItem: vi.fn(), length: 0, key: vi.fn() })
    clearCloudSession()
    expect(localStorage.removeItem).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
