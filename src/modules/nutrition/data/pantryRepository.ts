import { titanDatabase } from '../../../database/titanDatabase'
import { subtractPantry } from '../calculation/nutritionCalculations'
import type { PantryItemRecord } from '../types/foundation'
export const listPantryItems=(userId:string)=>titanDatabase.pantryItems.where('userId').equals(userId).toArray()
export async function upsertPantryItem(item:PantryItemRecord){const found=await titanDatabase.pantryItems.where('userId').equals(item.userId).filter(x=>x.foodId===item.foodId&&x.unit===item.unit).first();await titanDatabase.pantryItems.put(found?{...item,id:found.id,createdAt:found.createdAt}:item);return item}
export const removePantryItem=(id:string)=>titanDatabase.pantryItems.delete(id)
export async function calculateAvailableQuantity(userId:string,foodId:string){return (await listPantryItems(userId)).filter(x=>x.foodId===foodId).reduce((n,x)=>n+x.quantity,0)}
export async function calculatePurchaseRequirement(userId:string,foodId:string,required:number){return subtractPantry(required,await calculateAvailableQuantity(userId,foodId))}
