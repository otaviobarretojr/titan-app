import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { prepareInitialData } from '../../../database/seeds/seedToday'
import { getCoachReport, persistCoachInsights } from '../../coach/data/coachRepository'
import { getTitanLocalDate } from '../../../database/date'
import { titanDatabase } from '../../../database/titanDatabase'
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

  useEffect(() => {
    if (!data?.coach?.dailyInsights?.length) return
    let cancelled = false
    titanDatabase.coachRecommendations.where('userId').equals('local-user').toArray()
      .then((history) => { if (!cancelled) return persistCoachInsights(data.coach!.dailyInsights, getTitanLocalDate(), history) })
      .catch((reason) => console.warn('[TITAN] Falha ao persistir insights do Coach.', reason))
    return () => { cancelled = true }
  }, [data?.coach])

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
