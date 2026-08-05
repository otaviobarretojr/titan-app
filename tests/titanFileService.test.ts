import { describe, expect, it } from 'vitest'
import { validateEnvelope, validatePayload } from '../src/services/titanFile/titanFileService'

describe('titanFileService', () => {
  it('rejects non TITAN envelopes', () => { expect(() => validateEnvelope({ schema: 'OTHER' })).toThrow(/TITAN/) })
  it('validates profile payload completeness', () => {
    const envelope = validateEnvelope({ schema: 'TITAN', schemaVersion: '1.0', type: 'profile', title: 'Perfil', author: 'TITAN', createdAt: new Date().toISOString(), payload: { name: 'Ana', heightCm: 170, weightKg: 70, objective: 'Força', trainingDays: ['Segunda'], routine: 'Office', wakeTime: '06:00', workTime: '09:00-18:00', workoutTime: '19:00', sleepTime: '22:30', timezone: 'America/Sao_Paulo', goals: ['Consistência'] } })
    expect(() => validatePayload(envelope)).not.toThrow()
  })
})
