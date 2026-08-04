import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteBodyMetric,
  deleteProgressPhoto,
  getEvolutionSummary,
  saveBodyMetric,
  saveProgressPhoto,
  saveBioimpedance,
} from '../data/evolutionRepository'
import type { BioimpedanceInput, BodyMetricInput, PhotoPose } from '../types/evolution'

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
    saveBodyMetric: (input: BodyMetricInput) => runAction(() => saveBodyMetric(input)),
    saveBioimpedance: (input: BioimpedanceInput) => runAction(() => saveBioimpedance(input)),
    deleteBodyMetric: (id: string) =>
      runAction(() => deleteBodyMetric(id)),
    saveProgressPhoto: (input: {
      imageDataUrl: string
      pose: PhotoPose
      weightKg: number | null
      notes: string
    }) => runAction(() => saveProgressPhoto(input)),
    deleteProgressPhoto: (id: string) =>
      runAction(() => deleteProgressPhoto(id)),
  }
}
