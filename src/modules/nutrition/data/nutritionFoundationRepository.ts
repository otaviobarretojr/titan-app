import { titanDatabase } from '../../../database/titanDatabase'
import { addMacros, calculateMacros } from '../calculation/nutritionCalculations'
import type { FoodExecutionRecord, MealExecutionRecord, NutritionPlanRecord } from '../types/foundation'
export async function createNutritionPlan(plan:NutritionPlanRecord){await titanDatabase.nutritionPlans.add(plan);return plan}
export const getActiveNutritionPlan=(userId:string)=>titanDatabase.nutritionPlans.where('userId').equals(userId).filter(p=>p.status==='active').first()
export const archiveNutritionPlan=(id:string)=>titanDatabase.nutritionPlans.update(id,{status:'archived',updatedAt:new Date().toISOString()})
export const listPlanDays=(planId:string)=>titanDatabase.nutritionPlanDays.where('planId').equals(planId).toArray()
export const listMealsForDay=(planDayId:string)=>titanDatabase.plannedMeals.where('planDayId').equals(planDayId).toArray()
export const listFoodsForMeal=(plannedMealId:string)=>titanDatabase.plannedFoods.where('plannedMealId').equals(plannedMealId).toArray()
export async function createMealExecution(row:MealExecutionRecord){await titanDatabase.mealExecutions.add(row);return row}
export const updateFoodExecution=(row:FoodExecutionRecord)=>titanDatabase.foodExecutions.put(row)
export const completeMealExecution=(id:string)=>titanDatabase.mealExecutions.update(id,{status:'completed',completedAt:new Date().toISOString(),updatedAt:new Date().toISOString()})
export const skipMealExecution=(id:string)=>titanDatabase.mealExecutions.update(id,{status:'skipped',completedAt:new Date().toISOString(),updatedAt:new Date().toISOString()})
export async function calculateMealProgress(id:string){const execution=await titanDatabase.mealExecutions.get(id);if(!execution)throw new Error('Execução inexistente.');const planned=await listFoodsForMeal(execution.plannedMealId),actual=await titanDatabase.foodExecutions.where('mealExecutionId').equals(id).toArray();const macro=async(rows:Array<{foodId:string;quantity:number}>)=>addMacros(await Promise.all(rows.map(async r=>{const f=await titanDatabase.foodLibrary.get(r.foodId);if(!f)throw new Error('Alimento inexistente.');return calculateMacros(f,r.quantity)})));return {planned:await macro(planned),consumed:await macro(actual),status:execution.status}}
export async function calculateDailyNutritionProgress(userId:string,localDate:string){const executions=await titanDatabase.mealExecutions.where('userId').equals(userId).filter(e=>e.localDate===localDate).toArray();return Promise.all(executions.map(e=>calculateMealProgress(e.id)))}
export const listPendingMeals=async(userId:string,localDate:string)=>{const meals=await titanDatabase.plannedMeals.where('userId').equals(userId).filter(m=>m.localDate===localDate).toArray();const done=new Set((await titanDatabase.mealExecutions.where('userId').equals(userId).filter(e=>e.localDate===localDate).toArray()).map(e=>e.plannedMealId));return meals.filter(m=>!done.has(m.id))}
