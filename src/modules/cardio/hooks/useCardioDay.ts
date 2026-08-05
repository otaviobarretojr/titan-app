import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { prepareInitialData } from '../../../database/seeds/seedToday'
import {
  completeCardio,
  getCardioDay,
  resetCardio,
  startCardio,
} from '../data/cardioRepository'

export function useCardioDay() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    prepareInitialData()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar o cardio.',
        )
      })
  }, [])

  const cardio = useLiveQuery(
    () => (isReady ? getCardioDay() : null),
    [isReady],
    null,
  )

  async function runAction(action: () => Promise<unknown>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar o cardio.',
      )
    }
  }

  return {
    cardio,
    error,
    isLoading:
      !error && (!isReady || cardio === undefined || cardio === null),
    startCardio: (cardioPlanId: string) =>
      runAction(() => startCardio(cardioPlanId)),
    completeCardio: (input: {
      sessionId: string
      durationMinutes: number
      distanceKm: number | null
      averageHeartRate: number | null
      perceivedEffort: number
      notes: string
    }) => runAction(() => completeCardio(input)),
    resetCardio: (sessionId: string) =>
      runAction(() => resetCardio(sessionId)),
  }
}
