import { describe, expect, it } from 'vitest'
import { calculateTitanScore, type CoachEngineInput } from './coachEngine'

const base: CoachEngineInput = {
  currentMinutes: 720,
  proteinConsumedG: 0,
  proteinTargetG: 180,
  caloriesConsumedKcal: 0,
  calorieTargetKcal: 2500,
  hydrationConsumedMl: 0,
  hydrationTargetMl: 3000,
  sleepMinutes: null,
  sleepTargetMinutes: 480,
  pendingMeals: 0,
  workoutStatus: 'none',
  cardioStatus: 'none',
  plannedWorkoutMinutes: null,
  consistency: 0,
  hasNutritionData: false,
  hasHydrationData: false,
  hasConsistencyData: false,
}

describe('Release v1.0.1 score integrity', () => {
  it('retorna Sem dados suficientes em banco limpo e ausência total de dados', () => {
    const score = calculateTitanScore(base)
    expect(score.value).toBeNull()
    expect(score.label).toBe('Sem dados suficientes')
    expect(score.measuredCategories).toEqual([])
  })

  it('não pontua treino planejado nem cardio planejado', () => {
    const score = calculateTitanScore({ ...base, workoutStatus: 'planned', cardioStatus: 'planned' })
    expect(score.value).toBeNull()
    expect(score.breakdown.training).toBe(0)
    expect(score.breakdown.cardio).toBe(0)
    expect(score.measuredCategories).toEqual([])
  })

  it('não considera sessão iniciada sem conclusão como execução real', () => {
    const score = calculateTitanScore({ ...base, workoutStatus: 'started', cardioStatus: 'started' })
    expect(score.value).toBeNull()
    expect(score.measuredCategories).toEqual([])
  })

  it('mantém categoria concluída como evidência, mas exige categorias suficientes para Score global', () => {
    const score = calculateTitanScore({ ...base, workoutStatus: 'completed' })
    expect(score.value).toBeNull()
    expect(score.breakdown.training).toBe(100)
    expect(score.measuredCategories).toEqual(['training'])
  })

  it('calcula Score quando há categorias parcialmente medidas suficientes', () => {
    const score = calculateTitanScore({
      ...base,
      workoutStatus: 'completed',
      hydrationConsumedMl: 1500,
      hasHydrationData: true,
    })
    expect(score.value).toBe(80)
    expect(score.measuredCategories).toEqual(['hydration', 'training'])
  })

  it('usa Score 0 somente quando há dados reais cujo resultado é zero em categorias suficientes', () => {
    const score = calculateTitanScore({ ...base, hasNutritionData: true, hasHydrationData: true })
    expect(score.value).toBe(0)
    expect(score.measuredCategories).toEqual(['nutrition', 'hydration'])
  })
})
