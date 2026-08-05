import { z } from 'zod'
import { titanDatabase, type ActivePlanRecord, type ImportHistoryRecord, type SupplementPlanRecord } from '../../database/titanDatabase'
import { TITAN_USER_ID } from '../../database/seeds/seedToday'

export type ActivePlanType = 'workout' | 'nutrition' | 'cardio' | 'supplements'
export const ACTIVE_PLAN_TYPES = ['workout', 'nutrition', 'cardio', 'supplements'] as const
export type TitanExpectedType = ActivePlanType | 'project' | 'profile'

const MAX_ITEMS = 100
const iso = z.string().datetime({ offset: true })
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const timezone = z.string().min(1).max(64).refine((value) => {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true } catch { return false }
}, 'timezone inválido')
const nonNegative = z.number().nonnegative()
const shortText = z.string().min(1).max(120)
const typed = <T extends TitanExpectedType>(expectedType: T) => z.object({ expectedType: z.literal(expectedType) })
const profileSchema = typed('profile').extend({ displayName: shortText, timezone, createdAt: iso.optional(), updatedAt: iso.optional() })
const workoutSchema = typed('workout').extend({ id: shortText, localDate: date, name: shortText, plannedTime: hhmm, exerciseCount: z.number().int().nonnegative().max(80), estimatedDurationMinutes: z.number().int().nonnegative().max(600) })
const nutritionSchema = typed('nutrition').extend({ id: shortText, localDate: date, calorieTargetKcal: nonNegative.max(10000), proteinTargetG: nonNegative.max(1000), hydrationTargetMl: nonNegative.max(15000), sleepTargetMinutes: nonNegative.max(1440) })
const cardioSchema = typed('cardio').extend({ id: shortText, localDate: date, title: shortText, type: z.enum(['walking','zone2','running','hiit']), plannedTime: hhmm, targetDurationMinutes: z.number().int().nonnegative().max(600), targetDistanceKm: nonNegative.max(500).nullable().optional() })
const supplementsSchema = typed('supplements').extend({ id: shortText, localDate: date, name: shortText, plannedTime: hhmm, dose: shortText })
const projectSchema = typed('project').extend({ profile: profileSchema.optional(), workout: z.array(workoutSchema).max(MAX_ITEMS).default([]), nutrition: z.array(nutritionSchema).max(MAX_ITEMS).default([]), cardio: z.array(cardioSchema).max(MAX_ITEMS).default([]), supplements: z.array(supplementsSchema).max(MAX_ITEMS).default([]) })
const envelopeSchema = z.object({ format: z.literal('titan-file'), version: z.literal('1.0.3'), exportedAt: iso, timezone, expectedType: z.enum(['profile','workout','nutrition','cardio','supplements','project']), payload: z.unknown() }).superRefine((value, ctx) => {
  const schema = { profile: profileSchema, workout: workoutSchema, nutrition: nutritionSchema, cardio: cardioSchema, supplements: supplementsSchema, project: projectSchema }[value.expectedType]
  const parsed = schema.safeParse(value.payload)
  if (!parsed.success) parsed.error.issues.forEach(issue => ctx.addIssue({ code: 'custom', path: ['payload', ...issue.path], message: issue.message }))
})

export type TitanEnvelope = z.infer<typeof envelopeSchema>
export type TitanImportPreview = { expectedType: TitanExpectedType; activePlanTypes: ActivePlanType[]; counts: Record<ActivePlanType | 'profile', number>; warnings: string[] }

function assertNoDuplicates(items: { id: string }[], label: string) { const seen = new Set<string>(); for (const item of items) { if (seen.has(item.id)) throw new Error(`Itens duplicados em ${label}: ${item.id}.`); seen.add(item.id) } }
function parseEnvelope(input: unknown) { const parsed = envelopeSchema.safeParse(input); if (!parsed.success) throw new Error(parsed.error.issues.map(issue => issue.message).join('; ')); return parsed.data }
function normalize(envelope: TitanEnvelope) {
  const payload = envelope.payload as Record<string, unknown>
  const project = envelope.expectedType === 'project' ? projectSchema.parse(payload) : { profile: envelope.expectedType === 'profile' ? profileSchema.parse(payload) : undefined, workout: envelope.expectedType === 'workout' ? [workoutSchema.parse(payload)] : [], nutrition: envelope.expectedType === 'nutrition' ? [nutritionSchema.parse(payload)] : [], cardio: envelope.expectedType === 'cardio' ? [cardioSchema.parse(payload)] : [], supplements: envelope.expectedType === 'supplements' ? [supplementsSchema.parse(payload)] : [] }
  assertNoDuplicates(project.workout, 'workout'); assertNoDuplicates(project.nutrition, 'nutrition'); assertNoDuplicates(project.cardio, 'cardio'); assertNoDuplicates(project.supplements, 'supplements')
  return project
}
export async function readTitanFile(file: File) { return parseEnvelope(JSON.parse(await file.text())) }
export function previewTitanImport(input: unknown): TitanImportPreview { const envelope = parseEnvelope(input); const p = normalize(envelope); return { expectedType: envelope.expectedType, activePlanTypes: ACTIVE_PLAN_TYPES.filter(type => p[type].length > 0), counts: { profile: p.profile ? 1 : 0, workout: p.workout.length, nutrition: p.nutrition.length, cardio: p.cardio.length, supplements: p.supplements.length }, warnings: envelope.expectedType === 'project' ? ['Projeto será distribuído sem entrar em activePlans.'] : [] } }
export async function confirmTitanImport(input: unknown): Promise<ImportHistoryRecord> {
  const envelope = parseEnvelope(input); const p = normalize(envelope); const now = new Date().toISOString(); const activePlans: ActivePlanRecord[] = ACTIVE_PLAN_TYPES.flatMap(type => p[type].map(item => ({ id: `active-${type}-${item.id}`, userId: TITAN_USER_ID, type, sourceId: item.id, localDate: item.localDate, createdAt: now, updatedAt: now })))
  const supplements: SupplementPlanRecord[] = p.supplements.map(item => ({ id: item.id, userId: TITAN_USER_ID, localDate: item.localDate, name: item.name, plannedTime: item.plannedTime, dose: item.dose, createdAt: now, updatedAt: now }))
  const history: ImportHistoryRecord = { id: `import-${crypto.randomUUID()}`, userId: TITAN_USER_ID, importedAt: now, expectedType: envelope.expectedType, counts: previewTitanImport(input).counts, status: 'completed' }
  await titanDatabase.transaction('rw', [titanDatabase.users, titanDatabase.dailyPlans, titanDatabase.workoutPlans, titanDatabase.cardioPlans, titanDatabase.supplementPlans, titanDatabase.activePlans, titanDatabase.importHistory], async () => {
    if (p.profile) await titanDatabase.users.put({ id: TITAN_USER_ID, displayName: p.profile.displayName, createdAt: p.profile.createdAt ?? now, updatedAt: now })
    await titanDatabase.dailyPlans.bulkPut(p.nutrition.map(item => ({ id: item.id, userId: TITAN_USER_ID, localDate: item.localDate, calorieTargetKcal: item.calorieTargetKcal, proteinTargetG: item.proteinTargetG, hydrationTargetMl: item.hydrationTargetMl, sleepTargetMinutes: item.sleepTargetMinutes, createdAt: now, updatedAt: now })))
    await titanDatabase.workoutPlans.bulkPut(p.workout.map(item => ({ id: item.id, userId: TITAN_USER_ID, localDate: item.localDate, name: item.name, plannedTime: item.plannedTime, exerciseCount: item.exerciseCount, estimatedDurationMinutes: item.estimatedDurationMinutes, createdAt: now, updatedAt: now })))
    await titanDatabase.cardioPlans.bulkPut(p.cardio.map(item => ({ id: item.id, userId: TITAN_USER_ID, localDate: item.localDate, title: item.title, type: item.type, plannedTime: item.plannedTime, targetDurationMinutes: item.targetDurationMinutes, targetDistanceKm: item.targetDistanceKm ?? null, createdAt: now, updatedAt: now })))
    await titanDatabase.supplementPlans.bulkPut(supplements); await titanDatabase.activePlans.bulkPut(activePlans); await titanDatabase.importHistory.add(history)
  })
  return history
}
