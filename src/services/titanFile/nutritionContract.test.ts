import { describe, expect, it } from 'vitest'
import { nutritionPayloadV11Schema } from './nutritionContract'
const macros={caloriesKcal:400,proteinG:30,carbohydrateG:40,fatG:13.3}
const payload={dailyTargets:{caloriesKcal:2000,proteinG:150,carbohydrateG:200,fatG:67,waterMl:2500},days:[{dayOfWeek:1,type:'training',meals:[{id:'meal-1',name:'Almoço',plannedTime:'12:00',sequence:1,foods:[{id:'item-1',foodId:'food-rice',name:'Arroz',quantity:100,unit:'g',macros}]}]}]}
describe('nutrition TITAN 1.1',()=>{
 it('accepts a deeply valid plan',()=>expect(nutritionPayloadV11Schema.parse(payload).days).toHaveLength(1))
 it('rejects invalid time, unit, empty structures and duplicate days',()=>{
  expect(()=>nutritionPayloadV11Schema.parse({...payload,days:[payload.days[0],payload.days[0]]})).toThrow()
  expect(()=>nutritionPayloadV11Schema.parse({...payload,days:[{...payload.days[0],meals:[]}]})).toThrow()
  expect(()=>nutritionPayloadV11Schema.parse({...payload,days:[{...payload.days[0],meals:[{...payload.days[0].meals[0],plannedTime:'25:00'}]}]})).toThrow()
 })
 it('rejects negative and calorically inconsistent macros',()=>expect(()=>nutritionPayloadV11Schema.parse({...payload,days:[{...payload.days[0],meals:[{...payload.days[0].meals[0],foods:[{...payload.days[0].meals[0].foods[0],macros:{...macros,caloriesKcal:900}}]}]}]})).toThrow())
})
