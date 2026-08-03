import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { seedToday } from '../../../database/seeds/seedToday'
import {
  addExerciseSet,
  finishWorkout,
  getTrainingWorkout,
  removeLastExerciseSet,
  startWorkout,
} from '../data/trainingRepository'

export function useTrainingWorkout() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seedToday()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar o treino.',
        )
      })
  }, [])

  const workout = useLiveQuery(
    () => (isReady ? getTrainingWorkout() : null),
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
          : 'Não foi possível atualizar o treino.',
      )
    }
  }

  return {
    workout,
    error,
    isLoading:
      !error && (!isReady || workout === undefined || workout === null),
    startWorkout: (workoutPlanId: string) =>
      runAction(() => startWorkout(workoutPlanId)),
    addExerciseSet: (input: {
      workoutSessionId: string
      exercisePlanId: string
      loadKg: number
      repetitions: number
      rir: number
    }) => runAction(() => addExerciseSet(input)),
    removeLastExerciseSet: (
      workoutSessionId: string,
      exercisePlanId: string,
    ) =>
      runAction(() =>
        removeLastExerciseSet(workoutSessionId, exercisePlanId),
      ),
    finishWorkout: (workoutSessionId: string) =>
      runAction(() => finishWorkout(workoutSessionId)),
  }
}
