import { useLiveQuery } from 'dexie-react-hooks'
import { getCardioHistory } from '../data/cardioRepository'

export function useCardioHistory() {
  const history = useLiveQuery(() => getCardioHistory(), [], [])

  return {
    history: history ?? [],
    isLoading: history === undefined,
  }
}
