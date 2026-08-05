import { titanDatabase } from '../../../database/titanDatabase'
import type { FoodLibraryRecord, MealExecutionRecord, NutritionPlanRecord, PantryItemRecord, ShoppingListRecord } from '../types'

/** Repository boundary: consumers never need direct access to nutrition Dexie stores. */
export const foodLibraryRepository = {
  get: (id: string) => titanDatabase.foodLibrary.get(id),
  listByCategory: (categoryId: string) => titanDatabase.foodLibrary.where('categoryId').equals(categoryId).toArray(),
  save: (record: FoodLibraryRecord) => titanDatabase.foodLibrary.put(record),
}
export const nutritionPlanRepository = {
  get: (id: string) => titanDatabase.nutritionPlans.get(id),
  listForUser: (userId: string) => titanDatabase.nutritionPlans.where('userId').equals(userId).toArray(),
  save: (record: NutritionPlanRecord) => titanDatabase.nutritionPlans.put(record),
}
export const mealExecutionRepository = {
  listForDate: (userId: string, localDate: string) => titanDatabase.mealExecutions.where('[userId+localDate]').equals([userId, localDate]).toArray(),
  save: (record: MealExecutionRecord) => titanDatabase.mealExecutions.put(record),
}
export const shoppingRepository = { save: (record: ShoppingListRecord) => titanDatabase.shoppingLists.put(record), listForUser: (userId: string) => titanDatabase.shoppingLists.where('userId').equals(userId).toArray() }
export const pantryRepository = { save: (record: PantryItemRecord) => titanDatabase.pantryItems.put(record), listForUser: (userId: string) => titanDatabase.pantryItems.where('userId').equals(userId).toArray() }
