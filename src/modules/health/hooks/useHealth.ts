import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteHealthExam,
  deleteHealthMetric,
  getHealthSummary,
  saveHealthExam,
  saveHealthMetric,
} from '../data/healthRepository'

export function useHealth() {
  const [error, setError] = useState<string | null>(null)

  const summary = useLiveQuery(() => getHealthSummary(), [], null)

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar os dados de saúde.',
      )
    }
  }

  return {
    summary,
    error,
    isLoading: summary === undefined || summary === null,
    saveMetric: (input: {
      systolicPressure: number | null
      diastolicPressure: number | null
      restingHeartRate: number | null
      symptom: string
      notes: string
    }) => runAction(() => saveHealthMetric(input)),
    deleteMetric: (id: string) =>
      runAction(() => deleteHealthMetric(id)),
    saveExam: (input: {
      examDate: string
      title: string
      category: string
      value: string
      referenceRange: string
      notes: string
    }) => runAction(() => saveHealthExam(input)),
    deleteExam: (id: string) =>
      runAction(() => deleteHealthExam(id)),
  }
}
