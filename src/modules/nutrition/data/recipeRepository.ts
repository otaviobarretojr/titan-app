import { titanDatabase } from '../../../database/titanDatabase'
import { calculateRecipeMacros as calculate, calculateRecipeYield } from '../calculation/nutritionCalculations'
import type { RecipeIngredientRecord, RecipeRecord } from '../types/foundation'
export async function createRecipe(recipe:RecipeRecord,ingredients:RecipeIngredientRecord[]=[]){await titanDatabase.transaction('rw',titanDatabase.recipes,titanDatabase.recipeIngredients,async()=>{await titanDatabase.recipes.add(recipe);await titanDatabase.recipeIngredients.bulkAdd(ingredients)});return recipe}
export async function updateRecipe(id:string,changes:Partial<RecipeRecord>){await titanDatabase.recipes.update(id,changes);return getRecipe(id)}
export async function getRecipe(id:string){return {recipe:await titanDatabase.recipes.get(id),ingredients:await titanDatabase.recipeIngredients.where('recipeId').equals(id).toArray()}}
export const listRecipes=(userId:string)=>titanDatabase.recipes.where('userId').equals(userId).toArray()
export async function calculateRecipeMacros(id:string){const ingredients=await titanDatabase.recipeIngredients.where('recipeId').equals(id).toArray();const rows=await Promise.all(ingredients.map(async i=>({food:await titanDatabase.foodLibrary.get(i.foodId),i})));return calculate(rows.map(({food,i})=>{if(!food)throw new Error('Alimento da receita inexistente.');return {macros:food,quantity:i.quantity,referenceQuantity:food.referenceQuantity}}))}
export { calculateRecipeYield }
