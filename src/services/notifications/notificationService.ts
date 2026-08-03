const REMINDER_STORAGE_KEY = 'titan-reminders-enabled'

export function notificationsSupported() {
  return 'Notification' in window
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

export function remindersEnabled() {
  return localStorage.getItem(REMINDER_STORAGE_KEY) === 'true'
}

export function setRemindersEnabled(enabled: boolean) {
  localStorage.setItem(REMINDER_STORAGE_KEY, String(enabled))
}

export async function showTitanNotification(input: {
  title: string
  body: string
  tag?: string
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
  })
}
