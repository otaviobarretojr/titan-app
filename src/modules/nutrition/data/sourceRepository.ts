import { titanDatabase } from '../../../database/titanDatabase'
import type { NutritionDataSourceRecord, NutritionSourceImportRecord } from '../types/foundation'
export const listSources=()=>titanDatabase.nutritionDataSources.toArray()
export const getSource=(id:string)=>titanDatabase.nutritionDataSources.get(id)
export async function registerSource(source:NutritionDataSourceRecord){if(!source.reference||!source.version)throw new Error('Fonte sem referência ou versão.');await titanDatabase.nutritionDataSources.put(source);return source}
export async function registerImport(record:NutritionSourceImportRecord){if(!await getSource(record.sourceId))throw new Error('Fonte inexistente.');await titanDatabase.nutritionSourceImports.put(record);return record}
export const listImports=(sourceId?:string)=>sourceId?titanDatabase.nutritionSourceImports.where('sourceId').equals(sourceId).toArray():titanDatabase.nutritionSourceImports.toArray()
export async function verifySourceIntegrity(id:string){const source=await getSource(id);if(!source) return {ok:false,message:'Fonte inexistente.'};const foods=await titanDatabase.foodLibrary.where('sourceId').equals(id).toArray();return {ok:foods.every(f=>f.sourceFoodId&&f.sourceReference&&f.sourceVersion),message:'Integridade verificada.'}}
