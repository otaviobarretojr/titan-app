import { titanDatabase, type ActivePlanRecord, type ActivePlanType, type AppPreferencesRecord, type UserProfileRecord } from '../../database/titanDatabase'

export type TitanEnvelopeType = ActivePlanType | 'profile'
export type TitanEnvelope = { schema: 'TITAN'; schemaVersion: '1.0'; type: TitanEnvelopeType; title: string; author: string; createdAt: string; payload: unknown }
export type TitanImportPreview = { envelope: TitanEnvelope; summary: string[] }

const planTypes = ['workout', 'nutrition', 'cardio', 'supplements', 'project'] as const
const envelopeTypes = ['profile', ...planTypes] as const

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function text(value: unknown, field: string) { if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} obrigatório.`); return value.trim() }
function numberValue(value: unknown, field: string) { if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} obrigatório.`); return value }
function stringArray(value: unknown, field: string) { if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error(`${field} obrigatório.`); return value.map((item) => item.trim()).filter(Boolean) }

export async function readTitanFile(file: File): Promise<TitanImportPreview> {
  let parsed: unknown
  try { parsed = JSON.parse(await file.text()) } catch { throw new Error('Arquivo TITAN inválido: JSON malformado.') }
  const envelope = validateEnvelope(parsed)
  validatePayload(envelope)
  return { envelope, summary: buildSummary(envelope) }
}

export function validateEnvelope(value: unknown): TitanEnvelope {
  if (!isObject(value)) throw new Error('Arquivo TITAN inválido: envelope ausente.')
  if (value.schema !== 'TITAN' || value.schemaVersion !== '1.0') throw new Error('Formato rejeitado: somente TITAN schemaVersion 1.0 é aceito.')
  if (!envelopeTypes.includes(value.type as TitanEnvelopeType)) throw new Error('Tipo TITAN não suportado.')
  return { schema: 'TITAN', schemaVersion: '1.0', type: value.type as TitanEnvelopeType, title: text(value.title, 'title'), author: text(value.author, 'author'), createdAt: text(value.createdAt, 'createdAt'), payload: value.payload }
}

export function validatePayload(envelope: TitanEnvelope) {
  if (!isObject(envelope.payload)) throw new Error('Payload TITAN obrigatório.')
  if (envelope.type === 'profile') toProfile(envelope.payload)
  else if (envelope.type === 'project') {
    const modules = envelope.payload.modules
    if (!isObject(modules)) throw new Error('Projeto TITAN requer payload.modules.')
  } else {
    if (!Array.isArray(envelope.payload.items)) throw new Error(`${envelope.type} requer payload.items.`)
  }
}

function toProfile(payload: Record<string, unknown>): UserProfileRecord {
  const now = new Date().toISOString()
  return { id: 'primary', name: text(payload.name, 'Nome'), heightCm: numberValue(payload.heightCm, 'Altura'), weightKg: numberValue(payload.weightKg, 'Peso'), objective: text(payload.objective, 'Objetivo'), trainingDays: stringArray(payload.trainingDays, 'Dias de treino'), routine: text(payload.routine, 'Rotina'), wakeTime: text(payload.wakeTime, 'Horário de acordar'), workTime: text(payload.workTime, 'Horário de trabalho'), workoutTime: text(payload.workoutTime, 'Horário do treino'), sleepTime: text(payload.sleepTime, 'Horário de dormir'), timezone: text(payload.timezone, 'Timezone'), goals: stringArray(payload.goals, 'Metas'), createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : now, updatedAt: now }
}

function buildSummary(envelope: TitanEnvelope) { return [`${envelope.title} por ${envelope.author}`, `Tipo: ${envelope.type}`, `Criado em: ${new Date(envelope.createdAt).toLocaleString('pt-BR')}`] }

export async function applyTitanImport(preview: TitanImportPreview) {
  validatePayload(preview.envelope)
  const now = new Date().toISOString()
  await titanDatabase.transaction('rw', titanDatabase.userProfile, titanDatabase.activePlans, titanDatabase.importHistory, titanDatabase.appPreferences, async () => {
    if (preview.envelope.type === 'profile') {
      const existing = await titanDatabase.userProfile.get('primary')
      const profile = toProfile(preview.envelope.payload as Record<string, unknown>)
      await titanDatabase.userProfile.put({ ...profile, createdAt: existing?.createdAt ?? profile.createdAt, updatedAt: now })
    } else {
      const plan: ActivePlanRecord = { id: preview.envelope.type, type: preview.envelope.type, title: preview.envelope.title, author: preview.envelope.author, sourceCreatedAt: preview.envelope.createdAt, payload: preview.envelope.payload, createdAt: now, updatedAt: now }
      await titanDatabase.activePlans.put(plan)
    }
    await titanDatabase.importHistory.add({ id: crypto.randomUUID(), type: preview.envelope.type, title: preview.envelope.title, author: preview.envelope.author, status: 'applied', message: 'Importação confirmada e aplicada em transação Dexie.', createdAt: now })
  })
}

export async function savePreference(patch: Partial<AppPreferencesRecord>) {
  const now = new Date().toISOString(); const current = await titanDatabase.appPreferences.get('primary')
  await titanDatabase.appPreferences.put({ id: 'primary', theme: 'system', onboardingDeferred: false, createdAt: current?.createdAt ?? now, updatedAt: now, ...current, ...patch })
}
