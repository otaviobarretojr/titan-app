import { z } from 'zod'
import { titanDatabase } from '../../../database/titanDatabase'
const sourceReference=z.object({sourceType:z.enum(['taco','usda_fdc','nutrition_label','user_custom','coach_estimate','imported_verified']),sourceFoodId:z.string().min(1),sourceVersion:z.string().min(1)})
const food=z.object({foodId:z.string().min(1).optional(),sourceReference:sourceReference.optional(),quantity:z.number().positive(),unit:z.string().min(1)}).refine(x=>Boolean(x.foodId)!==Boolean(x.sourceReference),{message:'Informe foodId ou referência externa.'})
const meal=z.object({id:z.string(),name:z.string(),foods:z.array(food),alternatives:z.array(food).optional()})
const day=z.object({localDate:z.string(),meals:z.array(meal)})
const dailyTargets=z.object({caloriesKcal:z.number().nonnegative(),proteinG:z.number().nonnegative(),carbohydrateG:z.number().nonnegative(),fatG:z.number().nonnegative()})
export const titanNutritionV11Schema=z.object({schemaVersion:z.literal('1.1'),dailyTargets,days:z.array(day)})
export const titanNutritionV10Schema=z.object({schemaVersion:z.literal('1.0'),dailyTargets:dailyTargets.optional(),days:z.array(z.object({localDate:z.string(),meals:z.array(z.object({id:z.string(),name:z.string()}))}))})
export type TitanNutritionV11=z.infer<typeof titanNutritionV11Schema>
export async function validateNutritionReferences(plan:TitanNutritionV11){for(const d of plan.days)for(const m of d.meals)for(const f of [...m.foods,...(m.alternatives??[])]){const found=f.foodId?await titanDatabase.foodLibrary.get(f.foodId):await titanDatabase.foodLibrary.where('sourceFoodId').equals(f.sourceReference!.sourceFoodId).filter(x=>x.sourceType===f.sourceReference!.sourceType&&x.sourceVersion===f.sourceReference!.sourceVersion).first();if(!found)return {ok:false,message:`Referência nutricional inexistente em ${m.name}.`}}return {ok:true,message:'Plano válido.'}}
export async function parseNutritionPlan(input:unknown){if((input as {schemaVersion?:string})?.schemaVersion==='1.0'){const legacy=titanNutritionV10Schema.parse(input);return {ok:true,legacy,message:'Plano 1.0 preservado; alimentos ausentes não foram inventados.'}}const plan=titanNutritionV11Schema.parse(input);return {...await validateNutritionReferences(plan),plan}}
