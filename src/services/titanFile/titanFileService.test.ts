import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = { profile: undefined as unknown, plans: [] as unknown[], history: [] as unknown[], failPut: false }
vi.mock('../../database/titanDatabase', () => ({
  titanDatabase: {
    userProfile: { get: vi.fn(async () => state.profile), put: vi.fn(async (row) => { if (state.failPut) throw new Error('db internal stack'); state.profile = row }) },
    activePlans: { toArray: vi.fn(async () => state.plans), get: vi.fn(async (id) => state.plans.find((p) => typeof p === 'object' && p !== null && 'id' in p && p.id === id)), put: vi.fn(async (row) => { state.plans = state.plans.filter((p) => typeof p === 'object' && p !== null && 'id' in p && p.id !== row.id).concat(row) }) },
    importHistory: { add: vi.fn(async (row) => state.history.push(row)) },
    transaction: vi.fn(async (_mode, _tables, fn) => fn()),
  },
}))

const makeFile = (name: string, body: unknown) => new File([typeof body === 'string' ? body : JSON.stringify(body)], name, { type: 'application/json' })
const envelope = (type: string, payload: unknown) => ({ schema:'TITAN', schemaVersion:'1.0', type, title:'Plano', author:'Coach', createdAt:'2026-08-05T12:00:00.000Z', payload })
const profile = { name:'A', displayName:'Atleta', heightCm:180, weightKg:80, goal:'Força', experience:'beginner', trainingDays:['monday'], wakeTime:'06:00', workStartTime:'09:00', workEndTime:'18:00', trainingTime:'19:00', sleepTime:'22:00', timezone:'UTC', calorieTargetKcal:2000, proteinTargetG:150, carbohydrateTargetG:200, fatTargetG:67, waterTargetMl:2500, sleepTargetMinutes:480, preferences:{notes:'',foodPreferences:[],restrictions:[]} }
const workout = { sessions:[{ id:'w1', name:'A', days:['monday'], plannedTime:'19:00', estimatedDurationMinutes:60, exercises:[{ name:'Agacho', muscleGroup:'pernas', sets:3, minReps:8, maxReps:10, restSeconds:90, targetRir:2 }] }] }
const nutrition = { meals:[{ id:'m1', name:'Café', plannedTime:'08:00', sequence:1, caloriesKcal:500, proteinG:30, carbohydrateG:60, fatG:15 }] }
const cardio = { sessions:[{ id:'c1', days:['monday'], type:'zone2', title:'Zona 2', plannedTime:'07:00', targetDurationMinutes:30, targetDistanceKm:null }] }
const supplements = { items:[{ id:'s1', name:'Creatina', dose:'5g', timing:'manhã', notes:'' }] }

describe('TITAN file v1.0.3', async () => {
 const service = await import('./titanFileService')
 beforeEach(()=>{ state.profile=undefined; state.plans=[]; state.history=[]; state.failPut=false; vi.stubGlobal('crypto', { randomUUID: () => `id-${Math.random()}` }) })
 it('valida contrato TITAN, expectedType e extensão oficial', async()=>{ const p=await service.readTitanFile(makeFile('perfil.titan.json', envelope('profile', profile)), 'profile'); expect(p.included).toEqual(['profile']); await expect(service.readTitanFile(makeFile('perfil.txt', envelope('profile', profile)), 'profile')).rejects.toThrow(/Use um arquivo/); await expect(service.readTitanFile(makeFile('treino.titan.json', envelope('workout', workout)), 'nutrition')).rejects.toThrow(/Este arquivo contém/) })
 it('rejeita JSON inválido, arquivo grande e payload inválido', async()=>{ await expect(service.readTitanFile(makeFile('x.json','{'), 'profile')).rejects.toThrow(/JSON/); const big=new File(['x'.repeat(service.TITAN_MAX_FILE_BYTES+1)], 'x.titan.json'); await expect(service.readTitanFile(big,'profile')).rejects.toThrow(/512 KB/); await expect(service.readTitanFile(makeFile('x.titan.json', envelope('profile',{...profile, timezone:'Mars'})), 'profile')).rejects.toThrow() })
 it('importa projeto completo sem salvar project em activePlans e preserva módulos ausentes', async()=>{ await service.confirmTitanImport(await service.readTitanFile(makeFile('base.titan.json', envelope('workout', workout)), 'workout')); await service.confirmTitanImport(await service.readTitanFile(makeFile('proj.titan.json', envelope('project',{ profile, nutrition, cardio, supplements })), 'project')); expect(state.profile).toBeTruthy(); expect(state.plans.map((p) => typeof p === 'object' && p !== null && 'type' in p ? p.type : '').sort()).toEqual(['cardio','nutrition','supplements','workout']); expect(state.plans.find((p) => typeof p === 'object' && p !== null && 'id' in p && p.id === 'project')).toBeUndefined() })
 it('registra falha sanitizada', async()=>{ const p=await service.readTitanFile(makeFile('perfil.titan.json', envelope('profile', profile)), 'profile'); state.failPut = true; await expect(service.confirmTitanImport(p)).rejects.toThrow(); expect(state.history.at(-1)?.status).toBe('failure'); expect(state.history.at(-1)?.message).not.toMatch(/stack|internal/) })
})
