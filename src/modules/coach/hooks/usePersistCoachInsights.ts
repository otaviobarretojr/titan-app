import { useEffect } from 'react'
import { getTitanLocalDate } from '../../../database/date'
import { persistCoachInsights } from '../data/coachRepository'
import type { CoachInsight } from '../types/coach'

export function usePersistCoachInsights(insights: CoachInsight[] | undefined) {
  useEffect(() => {
    if (!insights?.length) return
    persistCoachInsights(insights, getTitanLocalDate(), []).catch((error) => {
      console.warn('Persistência acessória do Coach falhou.', error)
    })
  }, [insights])
}
