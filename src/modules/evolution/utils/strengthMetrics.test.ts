import { expect, it } from 'vitest'
import { derivePersonalRecord } from './strengthMetrics'
it('removes a record when its source set is removed',()=>{const sets=[{loadKg:100,repetitions:5},{loadKg:80,repetitions:5}];expect(derivePersonalRecord(sets)?.loadKg).toBe(100);expect(derivePersonalRecord(sets.slice(1))?.loadKg).toBe(80);expect(derivePersonalRecord([])).toBeNull()})
