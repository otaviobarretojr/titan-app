import { useLiveQuery } from 'dexie-react-hooks'
import { getWeeklyReport } from '../data/reportsRepository'

export function useWeeklyReport() {
  const report = useLiveQuery(() => getWeeklyReport(), [], null)

  return {
    report,
    isLoading: report === undefined || report === null,
  }
}
