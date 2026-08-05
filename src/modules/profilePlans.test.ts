import { describe, expect, it } from 'vitest'
import { previewProject, validateTitanObject } from './profilePlans'

const base = { schema: 'TITAN', schemaVersion: '1.0', title: 'Projeto', author: 'Coach', createdAt: '2026-08-05T00:00:00.000Z' }
it('bloqueia arquivo renomeado com tipo interno incompatível', () => { expect(() => validateTitanObject({ ...base, type: 'workout', payload: { weeklyPlan: [] } }, 'nutrition')).toThrow('Arquivo incompatível') })
describe('formatos TITAN v1.0.3', () => {
  it('valida treino semanal e dia de descanso', () => { const parsed = validateTitanObject({ ...base, type: 'workout', payload: { weeklyPlan: [{ weekday: 3, sessionName: 'Recuperação', isRestDay: true, exercises: [] }] } }, 'workout'); expect(parsed.type).toBe('workout') })
  it('valida próxima refeição sem execução', () => { const parsed = validateTitanObject({ ...base, type: 'nutrition', payload: { meals: [{ time: '12:00', name: 'Almoço', foods: [], caloriesKcal: 600, proteinG: 40, carbohydrateG: 70, fatG: 18, alternatives: [] }] } }, 'nutrition'); expect(parsed.type).toBe('nutrition') })
  it('gera prévia de projeto completo preservando histórico', () => { const file = validateTitanObject({ ...base, type: 'project', payload: { profile: { name: 'Otavio', displayName: 'Otavio', heightCm: 180, referenceWeightKg: 90, mainGoal: 'Força', experienceLevel: 'avançado', trainingDaysPerWeek: 5, wakeTime: '06:00', workStartTime: '09:00', workEndTime: '18:00', preferredWorkoutTime: '19:00', sleepTime: '23:00', timezone: 'America/Sao_Paulo', goals: { caloriesKcal: 2500, proteinG: 180, carbohydrateG: 260, fatG: 70, waterMl: 3000, sleepHours: 8 }, preferences: [] }, workout: { weeklyPlan: [] }, nutrition: { meals: [] } } }, 'project'); expect(previewProject(file).historyPreserved).toBe(true) })
})
