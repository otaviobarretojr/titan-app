import { beforeEach, describe, expect, it, vi } from 'vitest'

type Row = Record<string, unknown>
const tables = new Map<string, Map<string, Row>>()

function table(name: string, key = 'id') {
  return {
    name,
    async put(row: Row) { tables.get(name)!.set(String(row[key]), structuredClone(row)) },
    async bulkPut(rows: Row[]) { for (const row of rows) await this.put(row) },
    async add(row: Row) { await this.put(row) },
    async clear() { tables.get(name)!.clear() },
    async count() { return tables.get(name)!.size },
    async get(id: string) { return tables.get(name)!.get(id) },
    where(field: string) { return { equals(value: unknown) { return { async delete() { for (const [id, row] of [...tables.get(name)!]) if (row[field] === value) tables.get(name)!.delete(id) }, async count() { return [...tables.get(name)!.values()].filter((row) => row[field] === value).length } } } } },
  }
}

const titanDatabase = { userProfile: table('userProfile'), activePlans: table('activePlans'), importHistory: table('importHistory'), appPreferences: table('appPreferences', 'key'), async transaction(_mode: string, _tables: unknown[], fn: () => Promise<void>) { const snapshot = new Map([...tables].map(([k, v]) => [k, new Map(v)])); try { await fn() } catch (error) { tables.clear(); for (const [k, v] of snapshot) tables.set(k, v); throw error } } }

vi.mock('../src/database/titanDatabase', () => ({ titanDatabase }))

const { importTitanFile, importTitanFileText, parseTitanFileText } = await import('../src/services/titanFile/titanFileService')
import type { TitanFile } from '../src/services/titanFile/titanFileService'

const now = '2026-08-05T00:00:00.000Z'
function file(): TitanFile { return { schema: 'TITAN', schemaVersion: '1.0', type: 'project', title: 'Release v1.0.3', author: 'Otávio', createdAt: now, payload: { userProfile: { id: 'otavio', displayName: 'Otávio', createdAt: '2020-01-01T00:00:00.000Z', updatedAt: now }, activePlans: { nutrition: [{ id: 'nutrition-1', userId: 'otavio', localDate: '2026-08-05', meals: [{ id: 'meal-1', name: 'Almoço', plannedTime: '12:00', caloriesKcal: 700, proteinG: 50, carbohydrateG: 80, fatG: 20 }], targets: { caloriesKcal: 3000, proteinG: 200, hydrationMl: 4000 }, createdAt: now, updatedAt: now }], training: [{ id: 'training-1', userId: 'otavio', localDate: '2026-08-05', name: 'Treino A', plannedTime: '18:00', exercises: [{ id: 'ex-1', name: 'Supino', muscleGroup: 'Peito', targetSets: 4, minReps: 6, maxReps: 10, targetRir: 2, restSeconds: 120 }], createdAt: now, updatedAt: now }], supplementation: [{ id: 'supp-1', userId: 'otavio', localDate: '2026-08-05', items: [{ id: 'creatina', name: 'Creatina', dosage: '5g', plannedTime: '08:00', notes: 'Com água' }], createdAt: now, updatedAt: now }] }, importHistory: [], appPreferences: { theme: 'premium' } } } }

beforeEach(() => { tables.clear(); for (const name of ['userProfile', 'activePlans', 'importHistory', 'appPreferences']) tables.set(name, new Map()); vi.restoreAllMocks() })

describe('TITAN file import v1.0.3', () => {
  it('rejeita schema inválido e contrato alternativo titan/kind/data', () => expect(() => parseTitanFileText(JSON.stringify({ schema: 'titan', kind: 'project', data: {} }))).toThrow())
  it('rejeita JSON inválido', () => expect(() => parseTitanFileText('{')).toThrow('JSON inválido.'))
  it('rejeita payload inválido profundamente', () => { const invalid = file(); invalid.payload.activePlans.training[0].exercises[0].maxReps = 1; expect(() => parseTitanFileText(JSON.stringify(invalid))).toThrow() })
  it('preserva treino ao importar nutrição', async () => { await importTitanFile(file()); const next = file(); next.payload.activePlans.nutrition[0].id = 'nutrition-2'; await importTitanFile(next, ['nutrition']); expect(await titanDatabase.activePlans.where('type').equals('training').count()).toBe(1); expect(await titanDatabase.activePlans.get('nutrition-2')).toBeTruthy() })
  it('preserva nutrição ao importar treino', async () => { await importTitanFile(file()); const next = file(); next.payload.activePlans.training[0].id = 'training-2'; await importTitanFile(next, ['training']); expect(await titanDatabase.activePlans.where('type').equals('nutrition').count()).toBe(1); expect(await titanDatabase.activePlans.get('training-2')).toBeTruthy() })
  it('persiste suplementação', async () => { await importTitanFile(file(), ['supplementation']); expect((await titanDatabase.activePlans.get('supp-1'))?.type).toBe('supplementation') })
  it('faz rollback total em falha intermediária', async () => { await importTitanFile(file()); vi.spyOn(titanDatabase.importHistory, 'add').mockRejectedValueOnce(new Error('falha')); const next = file(); next.payload.activePlans.nutrition[0].id = 'nutrition-rollback'; await expect(importTitanFile(next, ['nutrition'])).rejects.toThrow('falha'); expect(await titanDatabase.activePlans.get('nutrition-rollback')).toBeUndefined(); expect(await titanDatabase.activePlans.get('nutrition-1')).toBeTruthy() })
  it('preserva createdAt do perfil', async () => { await importTitanFile(file(), ['profile']); expect((await titanDatabase.userProfile.get('otavio'))?.createdAt).toBe('2020-01-01T00:00:00.000Z') })
  it('importa por módulo', async () => { await importTitanFile(file(), ['preferences']); expect(await titanDatabase.appPreferences.get('theme')).toMatchObject({ value: 'premium' }); expect(await titanDatabase.activePlans.count()).toBe(0) })
  it('importa projeto completo', async () => { await importTitanFileText(JSON.stringify(file())); expect(await titanDatabase.userProfile.count()).toBe(1); expect(await titanDatabase.activePlans.count()).toBe(3); expect(await titanDatabase.importHistory.count()).toBe(1); expect(await titanDatabase.appPreferences.count()).toBe(1) })
})
