import { describe, expect, it } from 'vitest'

import { calculatePace, formatPace } from './cardioMath'

describe('calculatePace', () => {
  it('calcula o ritmo em minutos por quilômetro', () => {
    expect(calculatePace(30, 5)).toBe(6)
  })

  it('não calcula o ritmo sem duração e distância válidas', () => {
    expect(calculatePace(0, 5)).toBeNull()
    expect(calculatePace(30, null)).toBeNull()
    expect(calculatePace(30, 0)).toBeNull()
  })
})

describe('formatPace', () => {
  it('formata minutos e segundos com duas casas', () => {
    expect(formatPace(5.5)).toBe('5:30 min/km')
  })

  it('normaliza o arredondamento de 60 segundos', () => {
    expect(formatPace(5.999)).toBe('6:00 min/km')
  })

  it('exibe um traço quando o ritmo não está disponível', () => {
    expect(formatPace(null)).toBe('—')
  })
})
