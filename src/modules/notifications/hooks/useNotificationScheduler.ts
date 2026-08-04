import { useEffect } from 'react'
import { checkDueNotifications } from '../../../services/notifications/notificationService'

export function useNotificationScheduler() {
  useEffect(() => {
    void checkDueNotifications()
    const interval = window.setInterval(() => { void checkDueNotifications() }, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') void checkDueNotifications() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible) }
  }, [])
}
