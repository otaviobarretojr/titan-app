import { titanDatabase } from '../titanDatabase'
import type { FoodLibraryRecord, PreparationState } from '../../modules/nutrition/types'

const categories = ['Proteínas','Carboidratos','Gorduras','Frutas','Vegetais','Laticínios','Suplementos','Outros']
const foods: Array<[string,string,PreparationState,number,number,number,number,number]> = [
 ['peito de frango cru','Proteínas','raw',120,22.5,0,2.6,0],['peito de frango grelhado','Proteínas','grilled',159,32,0,2.5,0],['patinho cru','Proteínas','raw',133,21.7,0,5.1,0],['patinho cozido','Proteínas','cooked',219,35.9,0,7.3,0],['tilápia crua','Proteínas','raw',96,20.1,0,1.7,0],['tilápia grelhada','Proteínas','grilled',128,26,0,2.7,0],['ovo inteiro','Proteínas','ready_to_eat',143,13,0.7,9.5,0],['clara de ovo','Proteínas','ready_to_eat',52,10.9,0.7,0.2,0],['atum drenado','Proteínas','drained',116,25.5,0,0.8,0],['whey protein','Suplementos','ready_to_eat',400,80,8,7,0],
 ['arroz branco cru','Carboidratos','raw',358,7.2,79,0.3,1.6],['arroz branco cozido','Carboidratos','cooked',128,2.5,28.1,0.2,1.6],['batata-doce crua','Carboidratos','raw',86,1.6,20.1,0.1,3],['batata-doce cozida','Carboidratos','cooked',77,0.6,18.4,0.1,2.2],['aveia','Carboidratos','ready_to_eat',394,13.9,66.6,8.5,9.1],['Rap10','Carboidratos','ready_to_eat',300,8,52,7,3],['feijão cozido','Carboidratos','cooked',76,4.8,13.6,0.5,8.5],
 ['banana','Frutas','ready_to_eat',89,1.1,22.8,0.3,2.6],['melancia','Frutas','ready_to_eat',30,0.6,7.6,0.2,0.4],['maçã','Frutas','ready_to_eat',52,0.3,13.8,0.2,2.4],['azeite','Gorduras','ready_to_eat',884,0,0,100,0],['pasta de amendoim','Gorduras','ready_to_eat',588,25,20,50,6],['iogurte natural','Laticínios','ready_to_eat',61,3.5,4.7,3.3,0],['leite desnatado','Laticínios','ready_to_eat',34,3.4,5,0.1,0],['brócolis','Vegetais','cooked',35,2.4,7.2,0.4,3.3],['alface','Vegetais','ready_to_eat',15,1.4,2.9,0.2,1.3],['tomate','Vegetais','ready_to_eat',18,0.9,3.9,0.2,1.2],
]
const slug = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-')
export async function seedFoodLibrary(now = new Date().toISOString()) {
 await titanDatabase.transaction('rw', [titanDatabase.foodCategories,titanDatabase.foodLibrary,titanDatabase.foodSubstitutions], async()=>{
  await titanDatabase.foodCategories.bulkPut(categories.map((name,sortOrder)=>({id:`seed-category-${slug(name)}`,name,sortOrder,createdAt:now,updatedAt:now})))
  const rows:FoodLibraryRecord[]=foods.map(([name,category,state,caloriesKcal,proteinG,carbohydrateG,fatG,fiberG])=>({id:`seed-food-${slug(name)}`,name,categoryId:`seed-category-${slug(category)}`,preparationState:state,baseQuantity:100,baseUnit:'g',caloriesKcal,proteinG,carbohydrateG,fatG,fiberG,source:'titan_seed',isCustom:false,createdAt:now,updatedAt:now}))
  await titanDatabase.foodLibrary.bulkPut(rows)
  const groups=[['peito de frango grelhado','patinho cozido','tilápia grelhada','atum drenado','whey protein'],['arroz branco cozido','batata-doce cozida','aveia','Rap10']]
  await titanDatabase.foodSubstitutions.bulkPut(groups.flatMap(group=>group.flatMap(source=>group.filter(t=>t!==source).map((target,matchingPriority)=>{const a=rows.find(x=>x.name===source)!;const b=rows.find(x=>x.name===target)!;const q=100*a.caloriesKcal/b.caloriesKcal;return {id:`seed-sub-${slug(source)}-${slug(target)}`,sourceFoodId:a.id,targetFoodId:b.id,matchingPriority:matchingPriority+1,suggestedQuantity:Math.round(q),suggestedUnit:'g' as const,calorieDifference:b.caloriesKcal*q/100-a.caloriesKcal,proteinDifference:b.proteinG*q/100-a.proteinG,carbohydrateDifference:b.carbohydrateG*q/100-a.carbohydrateG,fatDifference:b.fatG*q/100-a.fatG,createdAt:now,updatedAt:now}}))))
 })
}
