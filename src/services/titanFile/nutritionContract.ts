import { z } from 'zod'
import { FOOD_UNITS } from '../../modules/nutrition/types'

const nonNegative = z.number().finite().nonnegative().max(100_000)
const id = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const unit = z.enum(FOOD_UNITS)
const macroSchema = z.object({ caloriesKcal: nonNegative, proteinG: nonNegative, carbohydrateG: nonNegative, fatG: nonNegative, fiberG: nonNegative.optional() }).refine(v => Math.abs(v.proteinG*4+v.carbohydrateG*4+v.fatG*9-v.caloriesKcal) <= Math.max(50,v.caloriesKcal*.3), 'macros e calorias inconsistentes')
const alternative = z.object({ foodId:id, name:z.string().trim().min(1).max(120), quantity:nonNegative, unit, macros:macroSchema })
const food = z.object({ id, foodId:id, name:z.string().trim().min(1).max(120), quantity:nonNegative, unit, macros:macroSchema, alternatives:z.array(alternative).max(20).optional() })
const meal = z.object({ id, name:z.string().trim().min(1).max(120), plannedTime:hhmm, sequence:z.number().int().nonnegative().max(50), foods:z.array(food).min(1).max(100) }).superRefine((v,ctx)=>{ if(new Set(v.foods.map(x=>x.id)).size!==v.foods.length) ctx.addIssue({code:'custom',message:'alimentos duplicados'}); for(const f of v.foods) for(const a of f.alternatives??[]) if(a.foodId===f.foodId) ctx.addIssue({code:'custom',message:'alternativa referencia o próprio alimento'}) })
const day = z.object({ dayOfWeek:z.number().int().min(0).max(6), type:z.enum(['training','rest']), meals:z.array(meal).min(1).max(30) }).superRefine((v,ctx)=>{if(new Set(v.meals.map(x=>x.id)).size!==v.meals.length||new Set(v.meals.map(x=>x.sequence)).size!==v.meals.length)ctx.addIssue({code:'custom',message:'refeições duplicadas'})})
export const nutritionPayloadV11Schema = z.object({ dailyTargets:z.object({ caloriesKcal:nonNegative,proteinG:nonNegative,carbohydrateG:nonNegative,fatG:nonNegative,fiberG:nonNegative.optional(),waterMl:nonNegative }), days:z.array(day).min(1).max(7) }).superRefine((v,ctx)=>{if(new Set(v.days.map(x=>x.dayOfWeek)).size!==v.days.length)ctx.addIssue({code:'custom',message:'dias duplicados'})})
export type NutritionPayloadV11 = z.infer<typeof nutritionPayloadV11Schema>

type LegacyNutrition = { meals:Array<{id:string;name:string;plannedTime:string;sequence:number;caloriesKcal:number;proteinG:number;carbohydrateG:number;fatG:number}> }
/** Safely adapts the limited 1.0 plan. No persistence occurs if required food detail is absent. */
export function adaptNutritionV10(payload: LegacyNutrition): NutritionPayloadV11 {
 throw new Error(`O plano 1.0 “${payload.meals[0]?.name ?? 'sem refeições'}” foi preservado, mas não contém alimentos suficientes para conversão automática.`)
}
