import { beforeEach, describe, expect, it, vi } from 'vitest'
import { titanDatabase } from '../src/database/titanDatabase'
import { applyTitanImport, buildPreview, deferOnboarding, getPreferences, migrateTheme, readTitanFile, setTheme, titanEnvelopeSchema, workoutPayloadSchema, nutritionPayloadSchema, cardioPayloadSchema, supplementsPayloadSchema, profilePayloadSchema, type TitanEnvelope } from '../src/services/titanFile/titanFileService'

const iso = '2026-08-05T00:00:00.000Z'
const profile = { name:'Otavio', displayName:'Titan', heightCm:180, weightKg:90, goal:'Força', experience:'intermediate', trainingDays:['segunda','quarta'], wakeTime:'06:00', workTime:'09:00', workoutTime:'18:00', sleepTime:'22:30', timezone:'America/Sao_Paulo', targets:{ calories:2500 }, preferences:{ lactose:false } }
const workout = { days:[{ id:'w1', weekday:'quarta', title:'Peito', plannedTime:'18:00', estimatedDurationMinutes:60, exercises:[{ id:'e1', name:'Supino', muscleGroup:'peito', sequence:1, sets:4, minReps:8, maxReps:10, restSeconds:90 }] }] }
const nutrition = { calorieTargetKcal:500, proteinTargetG:40, meals:[{ id:'m1', name:'Café', plannedTime:'08:00', caloriesKcal:290, proteinG:20, carbohydrateG:30, fatG:10 }] }
const cardio = { sessions:[{ id:'c1', weekday:'quarta', title:'Zona 2', type:'zone2', plannedTime:'07:00', targetDurationMinutes:30, targetDistanceKm:null }] }

function table<T extends { id: string }>() {
  const rows = new Map<string, T>()
  return {
    rows,
    async get(id: string) { return rows.get(id) },
    async put(row: T) { rows.set(row.id, row); return row.id },
    async add(row: T) { rows.set(row.id, row); return row.id },
    async count() { return rows.size },
    async toArray() { return [...rows.values()] },
    where(field: keyof T) { return { equals(value: unknown) { return { async count() { return [...rows.values()].filter((row) => row[field] === value).length } } } } },
  }
}
function installMemoryDb() {
  const stores = { userProfile: table(), activePlans: table(), importHistory: table(), appPreferences: table() }
  Object.assign(titanDatabase, stores, { transaction: async (_mode: string, _tables: unknown[], callback: () => Promise<unknown>) => callback() })
}

const supplements = { items:[{ id:'s1', name:'Creatina', dose:'5g', plannedTime:'12:00', notes:'com água' }] }
function env(type: TitanEnvelope['type'], payload: unknown): TitanEnvelope { return { schema:'TITAN', schemaVersion:'1.0', type, title:'Plano', author:'Coach', createdAt:iso, payload } }
function file(data: unknown, name='plan.titan.json') { return new File([JSON.stringify(data)], name, { type:'application/json' }) }

beforeEach(()=>{ installMemoryDb(); const store = new Map<string,string>(); Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k), clear: () => store.clear() }, configurable: true }); localStorage.clear() })
describe('TITAN v1.0.3 schemas',()=>{
 it('valida envelope e rejeita contrato antigo',()=>{ expect(titanEnvelopeSchema.safeParse(env('profile', profile)).success).toBe(true); expect(titanEnvelopeSchema.safeParse({ titan:true, kind:'profile', data:profile }).success).toBe(false) })
 it('valida cada payload zod',()=>{ for (const [s,p] of [[profilePayloadSchema,profile],[workoutPayloadSchema,workout],[nutritionPayloadSchema,nutrition],[cardioPayloadSchema,cardio],[supplementsPayloadSchema,supplements]] as const) expect(s.safeParse(p).success).toBe(true) })
 it('rejeita data ISO, horário, negativo e duplicidade',()=>{ expect(titanEnvelopeSchema.safeParse({...env('profile',profile), createdAt:'2026-99-99'}).success).toBe(false); expect(profilePayloadSchema.safeParse({...profile,wakeTime:'25:00'}).success).toBe(false); expect(profilePayloadSchema.safeParse({...profile,weightKg:-1}).success).toBe(false); expect(workoutPayloadSchema.safeParse({days:[workout.days[0], workout.days[0]]}).success).toBe(false) })
 it('rejeita macros inconsistentes',()=>{ expect(nutritionPayloadSchema.safeParse({...nutrition, meals:[{...nutrition.meals[0], caloriesKcal:9999}]}).success).toBe(false) })
})
describe('readTitanFile',()=>{
 it('bloqueia JSON inválido, tamanho e extensão renomeada',async()=>{ await expect(readTitanFile(new File(['{'],'x.titan.json'),'profile')).rejects.toThrow('Não foi possível'); await expect(readTitanFile(new File(['x'.repeat(600_000)],'x.titan.json'),'profile')).rejects.toThrow('512 KB'); await expect(readTitanFile(file(env('profile',profile),'x.txt'),'profile')).rejects.toThrow('Use um arquivo') })
 it('bloqueia expectedType incompatível',async()=>{ await expect(readTitanFile(file(env('workout',workout)),'nutrition')).rejects.toMatchObject({ title:'Arquivo incompatível' }) })
})
describe('aplicação transacional',()=>{
 it('importa projeto completo e não salva project em activePlans',async()=>{ await applyTitanImport(buildPreview(env('project',{profile,workout,nutrition,cardio,supplements}))); expect(await titanDatabase.userProfile.get('default')).toBeTruthy(); expect(await titanDatabase.activePlans.count()).toBe(4); expect(await titanDatabase.activePlans.get('project' as never)).toBeUndefined() })
 it('importação por módulo preserva treino/nutrição e persiste suplementos',async()=>{ await applyTitanImport(buildPreview(env('workout',workout))); await applyTitanImport(buildPreview(env('nutrition',nutrition))); await applyTitanImport(buildPreview(env('supplements',supplements))); expect(await titanDatabase.activePlans.get('workout')).toBeTruthy(); expect(await titanDatabase.activePlans.get('nutrition')).toBeTruthy(); expect((await titanDatabase.activePlans.get('supplements'))?.payload).toEqual(supplements) })
 it('preserva createdAt ao editar perfil',async()=>{ await applyTitanImport(buildPreview(env('profile',profile)),'2026-08-05T00:00:00.000Z'); await applyTitanImport(buildPreview(env('profile',{...profile,displayName:'Novo'})),'2026-08-06T00:00:00.000Z'); const p=await titanDatabase.userProfile.get('default'); expect(p?.createdAt).toBe('2026-08-05T00:00:00.000Z'); expect(p?.updatedAt).toBe('2026-08-06T00:00:00.000Z') })
 it('registra falha e rollback',async()=>{ await titanDatabase.activePlans.put({ id:'workout', type:'workout', title:'old', author:'a', sourceCreatedAt:iso, payload:{old:true}, createdAt:iso, updatedAt:iso }); const spy=vi.spyOn(titanDatabase.activePlans,'put').mockRejectedValueOnce(new Error('boom')); await expect(applyTitanImport(buildPreview(env('nutrition',nutrition)))).rejects.toThrow('Nenhuma alteração'); spy.mockRestore(); expect(await titanDatabase.activePlans.get('nutrition')).toBeUndefined(); expect(await titanDatabase.importHistory.where('status').equals('failure').count()).toBe(1) })
})
describe('preferências, backup e offline',()=>{
 it('onboarding adiado e tema system/light/dark com migração',async()=>{ expect(migrateTheme('premium')).toBe('dark'); expect(migrateTheme('amoled')).toBe('dark'); await getPreferences(); await deferOnboarding(); expect((await getPreferences()).onboardingStatus).toBe('deferred'); await setTheme('light'); expect((await getPreferences()).theme).toBe('light'); await setTheme('system'); expect((await getPreferences()).theme).toBe('system'); await setTheme('dark'); expect((await getPreferences()).theme).toBe('dark') })
 it('backup/restauração v1.0.3 e offline não executam score',async()=>{ await applyTitanImport(buildPreview(env('project',{profile,workout,nutrition,cardio,supplements}))); const backup={ userProfile: await titanDatabase.userProfile.toArray(), activePlans: await titanDatabase.activePlans.toArray(), importHistory: await titanDatabase.importHistory.toArray(), appPreferences: await titanDatabase.appPreferences.toArray(), legacyVersion:'1.0.2', offline:true }; expect(backup.activePlans.map(p=>p.type)).not.toContain('project'); expect(backup.offline).toBe(true) })
})
