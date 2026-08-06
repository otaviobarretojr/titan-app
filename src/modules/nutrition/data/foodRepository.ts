import { titanDatabase } from '../../../database/titanDatabase'
import { calculateMacros, normalizeNutritionLabel } from '../calculation/nutritionCalculations'
import type { FoodLibraryRecord, NutritionLabelSource } from '../types/foundation'
export const listFoods=()=>titanDatabase.foodLibrary.filter(f=>f.isActive).toArray()
export async function searchFoods(query:string){const q=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const ids=new Set((await titanDatabase.foodAliases.where('normalizedName').startsWith(q).toArray()).map(a=>a.foodId));return titanDatabase.foodLibrary.filter(f=>f.isActive&&(f.normalizedName.includes(q)||ids.has(f.id))).toArray()}
export const getFoodById=(id:string)=>titanDatabase.foodLibrary.get(id)
export const getFoodBySourceReference=(sourceId:string,sourceFoodId:string)=>titanDatabase.foodLibrary.where('[sourceId+sourceFoodId]').equals([sourceId,sourceFoodId]).first()
export const listFoodAliases=(foodId:string)=>titanDatabase.foodAliases.where('foodId').equals(foodId).toArray()
export function validateFoodProvenance(food:Partial<FoodLibraryRecord>){const ok=Boolean(food.sourceType&&food.sourceId&&food.sourceFoodId&&food.sourceVersion&&food.sourceReference&&food.sourceAccessedAt&&food.referenceQuantity&&food.referenceUnit&&food.preparationState&&food.dataConfidence);return {ok,message:ok?'Proveniência válida.':'Todo alimento exige fonte e referência completas.'}}
export async function createCustomFood(food:FoodLibraryRecord){if(!food.isCustom||food.sourceType!=='user_custom'||!validateFoodProvenance(food).ok)throw new Error('Alimento personalizado inválido.');await titanDatabase.foodLibrary.add(food);return food}
export async function createFoodFromNutritionLabel(food:FoodLibraryRecord,label:NutritionLabelSource){if(food.sourceType!=='nutrition_label')throw new Error('Fonte deve ser nutrition_label.');const normalized=normalizeNutritionLabel(label);const record={...food,...normalized,labelSource:label};if(!validateFoodProvenance(record).ok)throw new Error('Rótulo sem proveniência.');await titanDatabase.foodLibrary.add(record);return record}
export async function updateCustomFood(id:string,changes:Partial<FoodLibraryRecord>){const f=await getFoodById(id);if(!f?.isCustom)throw new Error('Apenas alimentos personalizados podem ser alterados.');await titanDatabase.foodLibrary.update(id,{...changes,sourceId:f.sourceId,sourceFoodId:f.sourceFoodId,sourceType:f.sourceType});return getFoodById(id)}
export async function deactivateCustomFood(id:string){const f=await getFoodById(id);if(!f?.isCustom)throw new Error('Apenas alimentos personalizados podem ser desativados.');return titanDatabase.foodLibrary.update(id,{isActive:false,updatedAt:new Date().toISOString()})}
export const calculateFoodMacros=calculateMacros
export const listSubstitutions=(foodId:string)=>titanDatabase.foodSubstitutions.where('foodId').equals(foodId).toArray()
