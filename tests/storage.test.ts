import { describe, expect, it } from 'vitest'
import { formatBytes } from '../src/services/storage/storageDiagnostics'

describe('diagnóstico de armazenamento', () => {
  it('formata quota, uso e indisponibilidade', () => {
    expect(formatBytes(null)).toBe('Indisponível')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})
