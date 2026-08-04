import { describe, expect, it } from 'vitest'
import { isIos, isStandalone } from '../src/services/pwa/installService'

describe('instalação PWA', () => {
  it('detecta iOS sem depender do prompt proprietário', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)')).toBe(true)
    expect(isIos('Mozilla/5.0 (Linux; Android 15)')).toBe(false)
  })

  it('reconhece o display standalone', () => {
    expect(isStandalone(true)).toBe(true)
  })
})
