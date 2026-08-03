import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { seedToday } from '../../../database/seeds/seedToday'
import {
  addHydration,
  getDashboardData,
} from '../data/dashboardRepository'

export function useDashboard() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seedToday()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar os dados do TITAN.',
        )
      })
  }, [])

  const data = useLiveQuery(
    () => (isReady ? getDashboardData() : null),
    [isReady],
    null,
  )

  async function registerWater(amountMl: number) {
    try {
      await addHydration(amountMl)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível registrar a água.',
      )
    }
  }

  return {
    data,
    error,
    isLoading: !error && (!isReady || data === undefined || data === null),
    registerWater,
  }
}
