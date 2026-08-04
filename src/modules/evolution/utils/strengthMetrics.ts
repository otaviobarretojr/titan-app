import { estimateOneRepMax } from '../../training/utils/trainingMath'
export function derivePersonalRecord(sets: Array<{loadKg:number;repetitions:number}>) { return sets.map(set=>({...set,estimatedOneRepMaxKg:estimateOneRepMax(set.loadKg,set.repetitions)})).sort((a,b)=>b.estimatedOneRepMaxKg-a.estimatedOneRepMaxKg)[0] ?? null }
