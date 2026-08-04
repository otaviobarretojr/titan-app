import { describe, expect, it } from 'vitest'
import { sha256, stableStringify } from './backupSerializer'

describe('cloud backup serializer integrity helpers', () => {
  it('creates deterministic JSON for checksum regardless of object key order', () => {
    expect(stableStringify({ b: 2, a: { d: 4, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 4 }, b: 2 }))
  })
  it('generates a stable sha-256 checksum', async () => {
    await expect(sha256('titan')).resolves.toHaveLength(64)
    await expect(sha256('titan')).resolves.toBe(await sha256('titan'))
  })
})
