import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { getAnalyticsSummary } from '../data/analyticsRepository'

export function useAnalytics() {
  const [period, setPeriod] = useState(90)

  const summary = useLiveQuery(
    () => getAnalyticsSummary(period),
    [period],
    null,
  )

  return {
    period,
    setPeriod,
    summary,
    isLoading: summary === undefined || summary === null,
  }
}
