import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { prepareInitialData } from '../../../database/seeds/seedToday'
import { getCoachReport } from '../../coach/data/coachRepository'
import {
  addHydration,
  getDashboardData,
} from '../data/dashboardRepository'

export function useDashboard() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    prepareInitialData()
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
    async () => { if (!isReady) return null; const [dashboard, coach] = await Promise.all([getDashboardData(), getCoachReport()]); return dashboard ? { ...dashboard, coach } : null },
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
    isLoading: !error && (!isReady || data === undefined),
    registerWater,
  }
}
