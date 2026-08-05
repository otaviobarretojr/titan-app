import { z } from 'zod'
import { titanDatabase, type ActivePlanType, type AppPreferencesRecord, type ImportHistoryRecord, type UserProfileRecord } from '../../database/titanDatabase'

export type TitanEnvelopeType = 'profile' | ActivePlanType | 'project'
export const TITAN_MAX_FILE_BYTES = 512 * 1024
const iso = z.string().datetime({ offset: true })
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const timezone = z.string().max(64).refine((value) => { try { Intl.DateTimeFormat(undefined, { timeZone: value }); return true } catch { return false } }, 'timezone inválido')
const text = (max = 120) => z.string().trim().min(1).max(max)
const nonNegative = z.number().finite().nonnegative()
const macroTargets = z.object({ calorieTargetKcal: nonNegative, proteinTargetG: nonNegative, carbohydrateTargetG: nonNegative, fatTargetG: nonNegative, waterTargetMl: nonNegative, sleepTargetMinutes: nonNegative }).refine(v => Math.abs((v.proteinTargetG * 4 + v.carbohydrateTargetG * 4 + v.fatTargetG * 9) - v.calorieTargetKcal) <= Math.max(150, v.calorieTargetKcal * 0.2), 'macros inconsistentes')
const noDuplicates = (values: string[]) => new Set(values).size === values.length

export const profilePayloadSchema = z.object({
  name: text(), displayName: text(), birthDate: z.string().date().nullable().optional(), sex: z.enum(['female','male','other','not_informed']).nullable().optional(), heightCm: nonNegative, weightKg: nonNegative,
  goal: text(240), experience: z.enum(['beginner','intermediate','advanced']), trainingDays: z.array(text(16)).max(7).refine(noDuplicates, 'dias duplicados'), wakeTime: hhmm, workStartTime: hhmm, workEndTime: hhmm, trainingTime: hhmm, sleepTime: hhmm, timezone,
  preferences: z.object({ notes: z.string().max(500).default(''), foodPreferences: z.array(text(80)).max(50).refine(noDuplicates), restrictions: z.array(text(80)).max(50).refine(noDuplicates) }).default({ notes: '', foodPreferences: [], restrictions: [] }),
}).merge(macroTargets)

const exercise = z.object({ name: text(), muscleGroup: text(80), sets: z.number().int().positive(), minReps: z.number().int().nonnegative(), maxReps: z.number().int().nonnegative(), restSeconds: nonNegative, targetRir: nonNegative }).refine(v => v.maxReps >= v.minReps, 'repetições inválidas')
export const workoutPayloadSchema = z.object({ sessions: z.array(z.object({ id: text(80), name: text(), days: z.array(text(16)).max(7).refine(noDuplicates), plannedTime: hhmm, estimatedDurationMinutes: nonNegative, exercises: z.array(exercise).min(1).max(80) })).min(1).refine(a => noDuplicates(a.map(x => x.id)), 'sessões duplicadas') })
export const nutritionPayloadSchema = z.object({ meals: z.array(z.object({ id: text(80), name: text(), plannedTime: hhmm, sequence: z.number().int().nonnegative(), caloriesKcal: nonNegative, proteinG: nonNegative, carbohydrateG: nonNegative, fatG: nonNegative })).min(1).refine(a => noDuplicates(a.map(x => x.id)) && noDuplicates(a.map(x => String(x.sequence))), 'refeições duplicadas') })
export const cardioPayloadSchema = z.object({ sessions: z.array(z.object({ id: text(80), days: z.array(text(16)).max(7), type: z.enum(['walking','zone2','running','hiit']), title: text(), plannedTime: hhmm, targetDurationMinutes: nonNegative, targetDistanceKm: nonNegative.nullable().optional() })).min(1).refine(a => noDuplicates(a.map(x => x.id)), 'cardio duplicado') })
export const supplementsPayloadSchema = z.object({ items: z.array(z.object({ id: text(80), name: text(), dose: text(80), timing: text(80), notes: z.string().max(300).default('') })).min(1).refine(a => noDuplicates(a.map(x => x.id)), 'suplementos duplicados') })
export const preferencesSchema: z.ZodType<Omit<AppPreferencesRecord, 'id' | 'createdAt' | 'updatedAt'>> = z.object({ theme: z.enum(['system','light','dark']), onboardingStatus: z.enum(['pending','completed','skipped']), reduceAnimations: z.boolean(), highContrast: z.boolean(), updateChannel: z.literal('stable'), lastUpdateCheckAt: iso.nullable().optional() })
export const importHistorySchema: z.ZodType<Omit<ImportHistoryRecord, 'id'>> = z.object({ importedAt: iso, type: z.enum(['profile','workout','nutrition','cardio','supplements','project']), title: z.string().max(160), author: z.string().max(120), fileName: z.string().max(180), status: z.enum(['success','failure']), message: z.string().max(240) })

export const projectPayloadSchema = z.object({ profile: profilePayloadSchema.optional(), workout: workoutPayloadSchema.optional(), nutrition: nutritionPayloadSchema.optional(), cardio: cardioPayloadSchema.optional(), supplements: supplementsPayloadSchema.optional() }).refine(v => Object.keys(v).length > 0, 'Projeto vazio')
export const envelopeSchema = z.object({ schema: z.literal('TITAN'), schemaVersion: z.literal('1.0'), type: z.enum(['profile','workout','nutrition','cardio','supplements','project']), title: text(160), author: text(120), createdAt: iso, payload: z.unknown() }).strict()

export type TitanPreview = { envelope: z.infer<typeof envelopeSchema>; fileName: string; included: TitanEnvelopeType[]; changed: TitanEnvelopeType[]; preserved: TitanEnvelopeType[]; historyPreserved: boolean; payload: unknown }
const planSchemas = { workout: workoutPayloadSchema, nutrition: nutritionPayloadSchema, cardio: cardioPayloadSchema, supplements: supplementsPayloadSchema } as const
const typeLabel: Record<TitanEnvelopeType,string> = { profile:'Perfil', workout:'Plano de Treino', nutrition:'Plano de Nutrição', cardio:'Plano de Cardio', supplements:'Plano de Suplementação', project:'Projeto TITAN' }

export class TitanFileError extends Error {
  title: string
  constructor(title: string, message: string) {
    super(message)
    this.title = title
  }
}
const sanitize = (e: unknown) => e instanceof TitanFileError ? e.message : e instanceof z.ZodError ? 'O arquivo TITAN não passou na validação de segurança.' : 'Não foi possível importar o arquivo TITAN.'

export async function readTitanFile(file: File, expectedType: TitanEnvelopeType): Promise<TitanPreview> {
  if (!file.name.endsWith('.titan.json') && !file.name.endsWith('.json')) throw new TitanFileError('Extensão incompatível', 'Use um arquivo .titan.json ou .json compatível.')
  if (file.size > TITAN_MAX_FILE_BYTES) throw new TitanFileError('Arquivo muito grande', 'O limite por arquivo TITAN é 512 KB.')
  let raw: unknown
  try { raw = JSON.parse(await file.text()) } catch { throw new TitanFileError('JSON inválido', 'Não foi possível ler o JSON do arquivo.') }
  const envelope = envelopeSchema.parse(raw)
  if (envelope.type !== expectedType) throw new TitanFileError('Arquivo incompatível', `Este arquivo contém um ${typeLabel[envelope.type]}. Vá para ${typeLabel[envelope.type]} → Importar plano.`)
  const payload = validatePayload(envelope.type, envelope.payload)
  const existing = await titanDatabase.activePlans.toArray(); const hasProfile = !!(await titanDatabase.userProfile.get('primary'))
  const included = envelope.type === 'project' ? Object.keys(payload as object) as TitanEnvelopeType[] : [envelope.type]
  return { envelope, fileName: file.name, payload, included, changed: included.filter(t => t === 'profile' ? hasProfile : existing.some(p => p.type === t)), preserved: (['profile','workout','nutrition','cardio','supplements'] as TitanEnvelopeType[]).filter(t => !included.includes(t)), historyPreserved: true }
}

function validatePayload(type: TitanEnvelopeType, payload: unknown) { if (type === 'profile') return profilePayloadSchema.parse(payload); if (type === 'project') return projectPayloadSchema.parse(payload); return planSchemas[type].parse(payload) }
async function history(input: Omit<ImportHistoryRecord,'id'|'importedAt'> & { importedAt?: string }) { const row = importHistorySchema.parse({ ...input, importedAt: input.importedAt ?? new Date().toISOString() }); await titanDatabase.importHistory.add({ id: crypto.randomUUID(), ...row }) }

export async function recordTitanImportFailure(fileName: string, expectedType: TitanEnvelopeType, error: unknown) { await history({ type: expectedType, title: '', author: '', fileName, status: 'failure', message: sanitize(error) }) }
export async function confirmTitanImport(preview: TitanPreview) { const now = new Date().toISOString(); try { await titanDatabase.transaction('rw', [titanDatabase.userProfile, titanDatabase.activePlans, titanDatabase.importHistory], async () => { const saveProfile = async (p: z.infer<typeof profilePayloadSchema>) => { const current = await titanDatabase.userProfile.get('primary'); const row: UserProfileRecord = { id:'primary', ...p, createdAt: current?.createdAt ?? now, updatedAt: now }; await titanDatabase.userProfile.put(row) }; const savePlan = async (type: ActivePlanType, payload: unknown) => titanDatabase.activePlans.put({ id: type, type, title: preview.envelope.title, author: preview.envelope.author, sourceFileName: preview.fileName, payload, importedAt: now, createdAt: now, updatedAt: now }); if (preview.envelope.type === 'project') { const p = preview.payload as Partial<Record<TitanEnvelopeType, unknown>>; if (p.profile) await saveProfile(p.profile as z.infer<typeof profilePayloadSchema>); for (const t of ['workout','nutrition','cardio','supplements'] as ActivePlanType[]) if (p[t]) await savePlan(t, p[t]) } else if (preview.envelope.type === 'profile') await saveProfile(preview.payload as z.infer<typeof profilePayloadSchema>); else await savePlan(preview.envelope.type, preview.payload); await history({ type: preview.envelope.type, title: preview.envelope.title, author: preview.envelope.author, fileName: preview.fileName, status: 'success', message: 'Importação concluída com rollback transacional disponível em falhas.' }) }) } catch (e) { await recordTitanImportFailure(preview.fileName, preview.envelope.type, e); throw new TitanFileError('Importação não concluída', sanitize(e)) } }
