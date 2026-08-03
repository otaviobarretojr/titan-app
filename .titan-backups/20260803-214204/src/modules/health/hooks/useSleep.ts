import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  clearTodaySleep,
  getTodaySleep,
  saveTodaySleep,
} from '../data/sleepRepository'

export function useSleep() {
  const [error, setError] = useState<string | null>(null)

  const sleep = useLiveQuery(() => getTodaySleep(), [], undefined)

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar o sono.',
      )
    }
  }

  return {
    sleep,
    error,
    isLoading: sleep === undefined,
    saveSleep: (durationMinutes: number) =>
      runAction(() => saveTodaySleep(durationMinutes)),
    clearSleep: () => runAction(clearTodaySleep),
  }
}
