import { z } from 'zod'
import { titanDatabase } from '../../database/titanDatabase'

const isoDate = z.string().datetime({ offset: true })
const moduleName = z.enum(['profile', 'nutrition', 'training', 'supplementation', 'preferences'])

const profileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict()

const nutritionPlanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    plannedTime: z.string().regex(/^\d{2}:\d{2}$/),
    caloriesKcal: z.number().int().nonnegative(),
    proteinG: z.number().nonnegative(),
    carbohydrateG: z.number().nonnegative(),
    fatG: z.number().nonnegative(),
  }).strict()).min(1),
  targets: z.object({
    caloriesKcal: z.number().int().positive(),
    proteinG: z.number().positive(),
    hydrationMl: z.number().int().positive(),
  }).strict(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict()

const trainingPlanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1),
  plannedTime: z.string().regex(/^\d{2}:\d{2}$/),
  exercises: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    muscleGroup: z.string().min(1),
    targetSets: z.number().int().positive(),
    minReps: z.number().int().positive(),
    maxReps: z.number().int().positive(),
    targetRir: z.number().int().min(0),
    restSeconds: z.number().int().positive(),
  }).strict()).min(1),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict().refine((plan) => plan.exercises.every((exercise) => exercise.maxReps >= exercise.minReps), 'maxReps precisa ser maior ou igual a minReps')

const supplementationPlanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    dosage: z.string().min(1),
    plannedTime: z.string().regex(/^\d{2}:\d{2}$/),
    notes: z.string(),
  }).strict()).min(1),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict()

const preferencesSchema = z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean(), z.null()]))

const payloadSchema = z.object({
  userProfile: profileSchema.optional(),
  activePlans: z.object({
    nutrition: z.array(nutritionPlanSchema).optional().default([]),
    training: z.array(trainingPlanSchema).optional().default([]),
    supplementation: z.array(supplementationPlanSchema).optional().default([]),
  }).strict().optional().default({ nutrition: [], training: [], supplementation: [] }),
  importHistory: z.array(z.object({
    id: z.string().min(1),
    importedAt: isoDate,
    modules: z.array(moduleName).min(1),
    title: z.string().min(1),
  }).strict()).optional().default([]),
  appPreferences: preferencesSchema.optional().default({}),
}).strict()

export const titanFileSchema = z.object({
  schema: z.literal('TITAN'),
  schemaVersion: z.literal('1.0'),
  type: z.enum(['project', 'module']),
  title: z.string().min(1),
  author: z.string().min(1),
  createdAt: isoDate,
  payload: payloadSchema,
}).strict()

export type TitanFile = z.infer<typeof titanFileSchema>
export type TitanImportModule = z.infer<typeof moduleName>

export function parseTitanFileText(text: string): TitanFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON inválido.')
  }
  return titanFileSchema.parse(raw)
}

const moduleToTables: Record<TitanImportModule, string[]> = {
  profile: ['userProfile'],
  nutrition: ['activePlans'],
  training: ['activePlans'],
  supplementation: ['activePlans'],
  preferences: ['appPreferences'],
}

export async function importTitanFile(file: TitanFile, modules?: TitanImportModule[]) {
  const selected = modules ?? inferModules(file)
  const now = new Date().toISOString()
  const touched = new Set(selected.flatMap((module) => moduleToTables[module]))

  await titanDatabase.transaction('rw', [titanDatabase.userProfile, titanDatabase.activePlans, titanDatabase.importHistory, titanDatabase.appPreferences], async () => {
    if (selected.includes('profile') && file.payload.userProfile) {
      await titanDatabase.userProfile.put(file.payload.userProfile)
    }

    for (const planType of ['nutrition', 'training', 'supplementation'] as const) {
      if (!selected.includes(planType)) continue
      const plans = file.payload.activePlans[planType]
      await titanDatabase.activePlans.where('type').equals(planType).delete()
      await titanDatabase.activePlans.bulkPut(plans.map((plan) => ({ id: plan.id, type: planType, userId: plan.userId, localDate: plan.localDate, title: 'name' in plan ? plan.name : `Suplementação ${plan.localDate}`, data: plan, createdAt: plan.createdAt, updatedAt: plan.updatedAt })))
    }

    if (selected.includes('preferences')) {
      await titanDatabase.appPreferences.clear()
      await titanDatabase.appPreferences.bulkPut(Object.entries(file.payload.appPreferences).map(([key, value]) => ({ key, value, updatedAt: now })))
    }

    await titanDatabase.importHistory.add({ id: `import-${crypto.randomUUID()}`, importedAt: now, fileTitle: file.title, fileCreatedAt: file.createdAt, modules: selected, touchedTables: [...touched] })
  })
}

export function inferModules(file: TitanFile): TitanImportModule[] {
  const modules: TitanImportModule[] = []
  if (file.payload.userProfile) modules.push('profile')
  if (file.payload.activePlans.nutrition.length) modules.push('nutrition')
  if (file.payload.activePlans.training.length) modules.push('training')
  if (file.payload.activePlans.supplementation.length) modules.push('supplementation')
  if (Object.keys(file.payload.appPreferences).length) modules.push('preferences')
  return file.type === 'project' ? ['profile', 'nutrition', 'training', 'supplementation', 'preferences'].filter((m) => modules.includes(m as TitanImportModule)) as TitanImportModule[] : modules
}

export async function importTitanFileText(text: string, modules?: TitanImportModule[]) {
  return importTitanFile(parseTitanFileText(text), modules)
}
