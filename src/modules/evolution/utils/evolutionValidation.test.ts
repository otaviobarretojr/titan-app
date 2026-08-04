import { describe, expect, it } from 'vitest'
import { validateBioimpedance, validateBodyMetric } from './evolutionValidation'
describe('evolution validation', () => {
 it('rejects impossible measures and non-finite values',()=>{expect(()=>validateBodyMetric({weightKg:-1})).toThrow('Peso');expect(()=>validateBodyMetric({weightKg:Number.NaN})).toThrow('Peso')})
 it('accepts partial bioimpedance without inventing fields',()=>expect(()=>validateBioimpedance({bodyFatPercentage:20,muscleMassKg:null})).not.toThrow())
 it('rejects impossible bioimpedance values',()=>expect(()=>validateBioimpedance({bodyWaterPercentage:120})).toThrow('Água'))
})
