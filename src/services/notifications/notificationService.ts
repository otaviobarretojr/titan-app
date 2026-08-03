import type {
  ReminderPreference,
  ReminderType,
} from '../../modules/notifications/types/notifications'

const SETTINGS_KEY = 'titan-notification-preferences'
const MASTER_KEY = 'titan-notifications-enabled'

const defaultPreferences: ReminderPreference[] = [
  {
    id: 'meal',
    label: 'Refeições',
    description: 'Lembretes para refeições planejadas.',
    enabled: true,
    time: '12:30',
  },
  {
    id: 'hydration',
    label: 'Hidratação',
    description: 'Lembrete diário de água.',
    enabled: true,
    time: '15:00',
  },
  {
    id: 'workout',
    label: 'Treino',
    description: 'Aviso antes do horário de treino.',
    enabled: true,
    time: '18:30',
  },
  {
    id: 'cardio',
    label: 'Cardio',
    description: 'Lembrete para cardio planejado.',
    enabled: false,
    time: '18:00',
  },
  {
    id: 'sleep',
    label: 'Sono',
    description: 'Aviso para iniciar a rotina noturna.',
    enabled: true,
    time: '21:30',
  },
]

export function notificationsSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )
}

export function getNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    throw new Error('Este navegador não oferece notificações.')
  }

  return Notification.requestPermission()
}

export function notificationsEnabled() {
  return localStorage.getItem(MASTER_KEY) === 'true'
}

export function setNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(MASTER_KEY, String(enabled))
}

export function getReminderPreferences(): ReminderPreference[] {
  const raw = localStorage.getItem(SETTINGS_KEY)

  if (!raw) return defaultPreferences

  try {
    const parsed = JSON.parse(raw) as ReminderPreference[]
    return defaultPreferences.map((defaultItem) => {
      const saved = parsed.find((item) => item.id === defaultItem.id)
      return saved ?? defaultItem
    })
  } catch {
    return defaultPreferences
  }
}

export function saveReminderPreferences(
  preferences: ReminderPreference[],
) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences))
}

export function updateReminderPreference(
  type: ReminderType,
  changes: Partial<ReminderPreference>,
) {
  const preferences = getReminderPreferences().map((item) =>
    item.id === type ? { ...item, ...changes } : item,
  )

  saveReminderPreferences(preferences)
  return preferences
}

export async function showTitanNotification(input: {
  title: string
  body: string
  tag?: string
  url?: string
}) {
  if (!notificationsSupported()) {
    throw new Error('Notificações não suportadas.')
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Permissão de notificação não concedida.')
  }

  const registration = await navigator.serviceWorker.ready

  await registration.showNotification(input.title, {
    body: input.body,
    tag: input.tag ?? 'titan',
    icon: './icons/titan.svg',
    badge: './icons/titan.svg',
    data: {
      url: input.url ?? './',
    },
  })
}
