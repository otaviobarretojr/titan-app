import { useLiveQuery } from 'dexie-react-hooks'
import { getCoachReport } from '../data/coachRepository'

export function useCoachReport() {
  const report = useLiveQuery(() => getCoachReport(), [], null)

  return {
    report,
    isLoading: report === undefined || report === null,
  }
}
