import { titanDatabase, type CardioPlanRecord, type DailyPlanRecord, type ExercisePlanRecord, type MealPlanRecord, type UserRecord, type WorkoutPlanRecord } from '../../database/titanDatabase'
import { saveProfile } from '../profile/profileService'

export type TitanImportKind = 'profile' | 'workout' | 'nutrition' | 'cardio' | 'supplements' | 'project'
export type TitanImportResult = { title: string; author: string; modules: string[]; updated: string[]; preserved: string[] }
export type TitanPreview = TitanImportResult & { createdAt: string; kind: TitanImportKind }

type TitanFile = { titan: true; kind: TitanImportKind; title: string; author: string; createdAt: string; data: Record<string, unknown> }
const moduleMap = { profile: ['users'], nutrition: ['dailyPlans', 'mealPlans'], workout: ['workoutPlans', 'exercisePlans'], cardio: ['cardioPlans'], supplements: [], project: ['users', 'dailyPlans', 'mealPlans', 'workoutPlans', 'exercisePlans', 'cardioPlans'] } as const

export class TitanFileError extends Error {
  title: string

  constructor(title = 'Arquivo incompatível', message = 'O arquivo não contém um JSON TITAN válido.') {
    super(message)
    this.title = title
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function arr<T>(data: Record<string, unknown>, key: string): T[] { const value = data[key]; if (value === undefined) return []; if (!Array.isArray(value)) throw new TitanFileError(); return value as T[] }
function validateEnvelope(value: unknown, expected: TitanImportKind): TitanFile {
  if (!isRecord(value) || value.titan !== true || value.kind !== expected || typeof value.title !== 'string' || typeof value.author !== 'string' || typeof value.createdAt !== 'string' || !isRecord(value.data)) throw new TitanFileError()
  // Validate entire payload before touching IndexedDB.
  for (const key of moduleMap[expected]) arr(value.data, key)
  return value as TitanFile
}

export async function parseTitanFileText(text: string, expected: TitanImportKind) {
  try { return validateEnvelope(JSON.parse(text) as unknown, expected) } catch (error) { if (error instanceof TitanFileError) throw error; throw new TitanFileError() }
}

export async function readTitanFile(file: File, expected: TitanImportKind) {
  try { return await parseTitanFileText(await file.text(), expected) } catch (error) { if (error instanceof TitanFileError) throw error; throw new TitanFileError() }
}

export function previewTitanImport(file: TitanFile): TitanPreview {
  const modules = [...moduleMap[file.kind]]
  return { title: file.title, author: file.author, createdAt: file.createdAt, kind: file.kind, modules, updated: modules, preserved: ['importHistory', ...(file.kind === 'nutrition' ? ['workout'] : []), ...(file.kind === 'workout' ? ['nutrition'] : [])] }
}

async function recordHistory(file: TitanFile | null, kind: TitanImportKind, result: 'success' | 'failure', message: string) {
  await titanDatabase.importHistory.add({ id: `import-${crypto.randomUUID()}`, importedAt: new Date().toISOString(), fileType: file?.kind ?? kind, title: file?.title ?? 'Arquivo incompatível', author: file?.author ?? 'Desconhecido', result, message })
}

export async function importTitanModule(file: TitanFile, expected: TitanImportKind, failAfter?: string): Promise<TitanImportResult> {
  validateEnvelope(file, expected)
  const data = file.data
  const preview = previewTitanImport(file)
  const tables = [titanDatabase.users, titanDatabase.dailyPlans, titanDatabase.mealPlans, titanDatabase.workoutPlans, titanDatabase.exercisePlans, titanDatabase.cardioPlans, titanDatabase.importHistory]
  try {
    await titanDatabase.transaction('rw', tables, async () => {
      if (expected === 'profile' || expected === 'project') for (const user of arr<UserRecord>(data, 'users')) await saveProfile(user)
      if (failAfter === 'profile') throw new Error('Falha intermediária simulada')
      if (expected === 'nutrition' || expected === 'project') { await titanDatabase.dailyPlans.bulkPut(arr<DailyPlanRecord>(data, 'dailyPlans')); await titanDatabase.mealPlans.bulkPut(arr<MealPlanRecord>(data, 'mealPlans')) }
      if (failAfter === 'nutrition') throw new Error('Falha intermediária simulada')
      if (expected === 'workout' || expected === 'project') { await titanDatabase.workoutPlans.bulkPut(arr<WorkoutPlanRecord>(data, 'workoutPlans')); await titanDatabase.exercisePlans.bulkPut(arr<ExercisePlanRecord>(data, 'exercisePlans')) }
      if (expected === 'cardio' || expected === 'project') await titanDatabase.cardioPlans.bulkPut(arr<CardioPlanRecord>(data, 'cardioPlans'))
      await recordHistory(file, expected, 'success', 'Importação concluída.')
    })
    return preview
  } catch (error) { await recordHistory(file, expected, 'failure', 'A importação falhou sem alterar dados.'); throw error }
}

export async function importTitanProject(file: TitanFile, failAfter?: string) { return importTitanModule(file, 'project', failAfter) }
export async function recordFailedTitanImport(kind: TitanImportKind, message = 'O arquivo não contém um JSON TITAN válido.') { await recordHistory(null, kind, 'failure', message) }
