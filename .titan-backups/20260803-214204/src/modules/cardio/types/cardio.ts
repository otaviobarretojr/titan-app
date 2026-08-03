export type CardioType = 'walking' | 'zone2' | 'running' | 'hiit'

export type CardioSessionStatus =
  | 'planned'
  | 'started'
  | 'completed'
  | 'cancelled'

export type CardioDay = {
  id: string
  title: string
  type: CardioType
  plannedTime: string
  targetDurationMinutes: number
  targetDistanceKm: number | null
  status: CardioSessionStatus
  sessionId: string | null
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  notes: string
}
