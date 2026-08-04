import { describe, expect, it } from 'vitest'
import type { NotificationPreference, ReminderComputationInput } from '../types/notifications'
import { calculateNextExecution, computeDueReminders, respectsWeekday } from './notificationEngine'

const basePref: NotificationPreference = { id: 'u:meal', userId: 'u', category: 'meal', enabled: true, time: '12:30', weekdays: [1, 2, 3, 4, 5], leadTimeMinutes: 0, intervalMinutes: null, lastRunAt: null, nextRunAt: null, createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' }
function input(preferences: NotificationPreference[], now = new Date('2026-08-04T16:00:00.000Z')): ReminderComputationInput { return { now, preferences, meals: [{ id: 'meal-1', name: 'Almoço', plannedTime: '12:30', resolved: false }], workout: { id: 'workout-1', name: 'Peito', plannedTime: '16:30', completed: false }, hydration: { consumedMl: 3900, targetMl: 4500 }, sleep: { registered: false }, coachPriority: { id: 'coach-1', title: 'Prioridade', message: 'Existe uma prioridade alta do Coach TITAN.', actionPath: '/coach' } } }
describe('notificationEngine', () => {
  it('calcula a próxima execução respeitando horário futuro', () => { expect(calculateNextExecution(basePref, new Date('2026-08-04T10:00:00.000Z'))).toContain('2026-08-04T12:30:00') })
  it('respeita dias da semana', () => { expect(respectsWeekday(new Date('2026-08-02T12:00:00.000Z'), basePref)).toBe(false); expect(calculateNextExecution(basePref, new Date('2026-08-01T10:00:00.000Z'))).toContain('2026-08-03') })
  it('aplica antecedência do pré-treino', () => { const reminders = computeDueReminders(input([{ ...basePref, category: 'preWorkout', id: 'u:pre', time: '16:30', leadTimeMinutes: 30 }])); expect(reminders[0]?.message).toBe('Seu treino começa em 30 minutos.') })
  it('não duplica candidatos com mesma chave', () => { const reminders = computeDueReminders(input([basePref, { ...basePref, id: 'u:meal2' }])); expect(reminders.filter((item) => item.category === 'meal')).toHaveLength(1) })
  it('não notifica tarefa de treino concluída', () => { const data = input([{ ...basePref, category: 'workout', id: 'u:workout', time: '16:30' }]); data.workout = { ...data.workout!, completed: true }; expect(computeDueReminders(data)).toHaveLength(0) })
  it('não notifica refeição resolvida', () => { const data = input([basePref]); data.meals[0].resolved = true; expect(computeDueReminders(data)).toHaveLength(0) })
  it('cria aviso de hidratação com volume restante', () => { const reminders = computeDueReminders(input([{ ...basePref, category: 'hydration', id: 'u:water', time: '15:00', intervalMinutes: 240 }])); expect(reminders[0]?.message).toBe('Faltam 600 ml para a meta de água.') })
  it('não trata ausência de sono como concluída', () => { const reminders = computeDueReminders(input([{ ...basePref, category: 'sleep', id: 'u:sleep', time: '15:00' }])); expect(reminders[0]?.category).toBe('sleep') })
  it('gera prioridade real do Coach quando configurada', () => { const reminders = computeDueReminders(input([{ ...basePref, category: 'coachPriority', id: 'u:coach', time: '15:00' }])); expect(reminders[0]?.actionPath).toBe('/coach') })
})
