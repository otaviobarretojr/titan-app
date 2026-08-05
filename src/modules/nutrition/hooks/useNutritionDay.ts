import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { prepareInitialData } from '../../../database/seeds/seedToday'
import {
  addHydration,
  clearMealEntry,
  completeMeal,
  getNutritionDayData,
  registerPartialMeal,
  skipMeal,
  substituteMeal,
} from '../data/nutritionRepository'

export function useNutritionDay() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    prepareInitialData()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar as refeições.',
        )
      })
  }, [])

  const data = useLiveQuery(
    () => (isReady ? getNutritionDayData() : null),
    [isReady],
    null,
  )

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar a refeição.',
      )
    }
  }

  return {
    data,
    error,
    isLoading: !error && (!isReady || data === undefined || data === null),
    completeMeal: (mealId: string) =>
      runAction(() => completeMeal(mealId)),
    registerPartialMeal: (mealId: string, percentage: number) =>
      runAction(() => registerPartialMeal(mealId, percentage)),
    substituteMeal: (mealId: string) =>
      runAction(() => substituteMeal(mealId)),
    skipMeal: (mealId: string) =>
      runAction(() => skipMeal(mealId)),
    clearMealEntry: (mealId: string) =>
      runAction(() => clearMealEntry(mealId)),
    addHydration: (amountMl: number) =>
      runAction(() => addHydration(amountMl)),
  }
}
