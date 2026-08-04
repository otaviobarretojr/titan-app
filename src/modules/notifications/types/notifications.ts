export type ReminderType =
  | 'meal'
  | 'hydration'
  | 'workout'
  | 'preWorkout'
  | 'sleep'
  | 'dailySummary'
  | 'weeklySummary'

export type ReminderPreference = {
  id: ReminderType
  label: string
  description: string
  enabled: boolean
  time: string
}
