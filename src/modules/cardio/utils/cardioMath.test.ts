import { describe, expect, it } from 'vitest'

import { calculatePace, formatPace, getCardioFeedback } from './cardioMath'

describe('cardioMath', () => {
  it('calcula o ritmo apenas para sessões com duração e distância válidas', () => {
    expect(calculatePace(30, 5)).toBe(6)
    expect(calculatePace(30, null)).toBeNull()
    expect(calculatePace(0, 5)).toBeNull()
  })

  it('formata o ritmo e normaliza o arredondamento de 60 segundos', () => {
    expect(formatPace(null)).toBe('—')
    expect(formatPace(5.5)).toBe('5:30 min/km')
    expect(formatPace(4.999)).toBe('5:00 min/km')
  })

  it('orienta o atleta de acordo com o tipo e o esforço da sessão', () => {
    expect(
      getCardioFeedback({
        type: 'zone2',
        perceivedEffort: 8,
        averageHeartRate: 150,
      }),
    ).toContain('Reduza o ritmo')

    expect(
      getCardioFeedback({
        type: 'hiit',
        perceivedEffort: 6,
        averageHeartRate: 150,
      }),
    ).toContain('abaixo do esperado')
  })
})
