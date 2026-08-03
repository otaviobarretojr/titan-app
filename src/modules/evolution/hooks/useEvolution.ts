import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteBodyMetric,
  getEvolutionSummary,
  saveBodyMetric,
} from '../data/evolutionRepository'

export function useEvolution() {
  const [error, setError] = useState<string | null>(null)

  const summary = useLiveQuery(() => getEvolutionSummary(), [], null)

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar a evolução.',
      )
    }
  }

  return {
    summary,
    error,
    isLoading: summary === undefined || summary === null,
    saveBodyMetric: (input: {
      weightKg: number
      waistCm: number | null
      armCm: number | null
      chestCm: number | null
      thighCm: number | null
      calfCm: number | null
      bodyFatPercentage: number | null
      notes: string
    }) => runAction(() => saveBodyMetric(input)),
    deleteBodyMetric: (id: string) =>
      runAction(() => deleteBodyMetric(id)),
  }
}
