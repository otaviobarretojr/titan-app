export type NotificationCategory =
  | 'meal'
  | 'overdueMeal'
  | 'hydration'
  | 'workout'
  | 'preWorkout'
  | 'sleep'
  | 'supplement'
  | 'weeklyReport'
  | 'coachPriority'

export type NotificationPermissionState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied'

export type NotificationPriority = 'low' | 'medium' | 'high'

export type NotificationPreference = {
  id: string
  userId: string
  category: NotificationCategory
  enabled: boolean
  time: string
  weekdays: number[]
  leadTimeMinutes: number
  intervalMinutes: number | null
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  updatedAt: string
}

export type NotificationInboxItem = {
  id: string
  userId: string
  category: NotificationCategory
  title: string
  message: string
  priority: NotificationPriority
  createdAt: string
  readAt: string | null
  dismissedAt: string | null
  actionLabel: string
  actionPath: string
  dedupeKey: string
}

export type ReminderCandidate = {
  category: NotificationCategory
  title: string
  message: string
  scheduledAt: string
  actionLabel: string
  actionPath: string
  priority: NotificationPriority
  dedupeKey: string
}

export type ReminderComputationInput = {
  now: Date
  preferences: NotificationPreference[]
  meals: Array<{ id: string; name: string; plannedTime: string; resolved: boolean }>
  workout: { id: string; name: string; plannedTime: string; completed: boolean } | null
  hydration: { consumedMl: number; targetMl: number }
  sleep: { registered: boolean }
  coachPriority: { id: string; title: string; message: string; actionPath: string } | null
}

export type ReminderType = NotificationCategory
export type ReminderPreference = NotificationPreference
