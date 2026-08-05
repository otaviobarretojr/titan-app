import { describe, expect, it, beforeEach, vi } from 'vitest'
import { CHUNK_RECOVERY_KEY, UPDATE_RELOAD_KEY, hasReloadAttempted, isChunkLoadError, reloadOnce } from '../src/services/pwa/updateRecovery'

const storage = new Map<string, string>()
const reload = vi.fn()

Object.defineProperty(globalThis, 'window', {
  value: {
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
    location: { reload },
  },
})

describe('recuperação segura de atualização PWA', () => {
  beforeEach(() => { storage.clear(); reload.mockClear() })

  it('detecta erros de chunk conhecidos', () => {
    expect(isChunkLoadError(new Error('ChunkLoadError: Loading chunk failed'))).toBe(true)
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(true)
    expect(isChunkLoadError('Importing a module script failed')).toBe(true)
  })

  it('recarrega uma única vez na confirmação de atualização', () => {
    expect(reloadOnce(UPDATE_RELOAD_KEY)).toBe(true)
    expect(hasReloadAttempted(UPDATE_RELOAD_KEY)).toBe(true)
    expect(reloadOnce(UPDATE_RELOAD_KEY)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('mantém chave separada para recuperação automática de chunk e previne loop', () => {
    expect(reloadOnce(CHUNK_RECOVERY_KEY)).toBe(true)
    expect(reloadOnce(CHUNK_RECOVERY_KEY)).toBe(false)
  })
})
