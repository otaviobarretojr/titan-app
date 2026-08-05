import { describe, expect, it } from 'vitest'
import { calculateTitanScore, calculateTrends, generateHistoricalInsights, type CoachEngineInput } from '../src/modules/coach/engine/coachEngine'

const empty: CoachEngineInput = { currentMinutes: 800, proteinConsumedG:0, proteinTargetG:150, caloriesConsumedKcal:0, calorieTargetKcal:2000, hydrationConsumedMl:0, hydrationTargetMl:2500, sleepMinutes:null, sleepTargetMinutes:480, pendingMeals:0, workoutStatus:'none', cardioStatus:'none', plannedWorkoutMinutes:null, consistency:0, hasNutritionData:false, hasHydrationData:false, hasConsistencyData:false }
describe('Score TITAN', () => {
  it('redistribui pesos e não converte ausência em zero', () => expect(calculateTitanScore(empty)).toMatchObject({value:null,label:'Sem dados suficientes',measuredCategories:[]}))
  it('calcula somente categorias medidas', () => expect(calculateTitanScore({...empty,hydrationConsumedMl:2000,hasHydrationData:true}).value).toBeNull())
})
describe('tendências', () => {
  it('compara apenas amostras reais', () => { const trend=calculateTrends([{date:'2026-07-20',protein:100},{date:'2026-07-21',protein:100},{date:'2026-07-27',protein:80},{date:'2026-07-28',protein:60}],'weekly')[0]; expect(trend).toMatchObject({metric:'protein',direction:'down',sampleSize:2,previousSampleSize:2}) })
  it('omite métricas com amostra insuficiente', () => expect(calculateTrends([{date:'2026-08-01',weight:80}],'weekly')).toEqual([]))
})
describe('insights históricos', () => {
  it('não gera conclusões sem dados', () => expect(generateHistoricalInsights([])).toEqual([]))
  it('detecta hidratação recorrente somente com amostra suficiente', () => { const days=[1,2,3].map(day=>({date:`2026-08-0${day}`,hydration:1000,hydrationTarget:2500})); expect(generateHistoricalInsights(days).some(x=>x.id==='recurring-low-hydration')).toBe(true); expect(generateHistoricalInsights(days.slice(0,2))).toEqual([]) })
  it('gera evidência, período, amostra, ação e rota', () => { const insight=generateHistoricalInsights([1,2,3,4].map(day=>({date:`2026-08-0${day}`,sleep:300,sleepTarget:480})))[0]; expect(insight).toMatchObject({id:'sleep-below-target',sampleSize:4,actionPath:'/health/sleep'}); expect(insight.evidence).toBeTruthy(); expect(insight.period).toBeTruthy(); expect(insight.message).toBeTruthy() })
})
