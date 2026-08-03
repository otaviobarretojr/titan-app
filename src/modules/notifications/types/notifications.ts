export type ReminderType =
  | 'meal'
  | 'hydration'
  | 'workout'
  | 'cardio'
  | 'sleep'

export type ReminderPreference = {
  id: ReminderType
  label: string
  description: string
  enabled: boolean
  time: string
}
