import { addInboxItem, getNotificationSnapshot, updateNotificationPreference } from '../../modules/notifications/data/notificationsRepository'
import type { NotificationPermissionState, ReminderCandidate } from '../../modules/notifications/types/notifications'

export function notificationsSupported() {
  return typeof globalThis.Notification !== 'undefined'
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported'
  return globalThis.Notification.permission
}
export function canDetectPwaInstall() { return typeof window !== 'undefined' && ('matchMedia' in window || 'navigator' in window) }
export function getPwaInstallStatus() { if (typeof window === 'undefined') return 'unknown'; const standalone = window.matchMedia?.('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)); return standalone ? 'installed' : 'browser' }
export async function requestNotificationPermission() { if (!notificationsSupported()) return 'unsupported'; return Notification.requestPermission() }
export async function showTitanNotification(input: { title: string; body: string; tag?: string; url?: string }) { if (!notificationsSupported()) throw new Error('Notificações não suportadas neste navegador.'); if (Notification.permission !== 'granted') throw new Error('Permissão de notificação não concedida.'); const notification = new Notification(input.title, { body: input.body, tag: input.tag ?? 'titan', icon: './icons/titan.svg', data: { url: input.url ?? './' } }); notification.onclick = () => { window.focus(); if (input.url) window.location.hash = input.url.startsWith('/') ? input.url : `/${input.url}` } }
export async function deliverReminder(candidate: ReminderCandidate) { await addInboxItem(candidate); try { await showTitanNotification({ title: candidate.title, body: candidate.message, tag: candidate.dedupeKey, url: candidate.actionPath }) } catch { /* Inbox persistente cobre ausência de suporte, permissão negada ou contexto suspenso. */ } }
export async function checkDueNotifications() { const snapshot = await getNotificationSnapshot(); await Promise.all(snapshot.due.map(deliverReminder)); await Promise.all(snapshot.due.map((item) => updateNotificationPreference(item.category, { lastRunAt: new Date().toISOString() }))); return snapshot.due.length }
export async function testNotification() { const candidate: ReminderCandidate = { category: 'coachPriority', title: 'TITAN', message: 'As notificações estão funcionando neste aparelho.', scheduledAt: new Date().toISOString(), actionLabel: 'Abrir central', actionPath: '/notifications', priority: 'low', dedupeKey: `test:${Date.now()}` }; await deliverReminder(candidate) }


// Compatibilidade com a central local anterior à migração Dexie 11.
// A nova central usa notificationPreferences no IndexedDB, mas estes helpers
// permanecem disponíveis para não quebrar fluxos e testes legados.
const LEGACY_NOTIFICATION_ENABLED_KEY =
  'titan:notifications:enabled'

const legacyReminderPreferences = [
  { id: 'meal' },
  { id: 'hydration' },
  { id: 'workout' },
  { id: 'preWorkout' },
  { id: 'dailySummary' },
  { id: 'weeklySummary' },
  { id: 'sleep' },
] as const

export function notificationsEnabled() {
  if (typeof localStorage === 'undefined') return false

  return (
    localStorage.getItem(
      LEGACY_NOTIFICATION_ENABLED_KEY,
    ) === 'true'
  )
}

export function setNotificationsEnabled(
  enabled: boolean,
) {
  if (typeof localStorage === 'undefined') return

  localStorage.setItem(
    LEGACY_NOTIFICATION_ENABLED_KEY,
    String(enabled),
  )
}

export function getReminderPreferences() {
  return [...legacyReminderPreferences]
}
