import {
  Bell,
  BellRing,
  Save,
} from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import {
  getNotificationPermission,
  getReminderPreferences,
  notificationsEnabled,
  requestNotificationPermission,
  saveReminderPreferences,
  setNotificationsEnabled,
  showTitanNotification,
} from '../../../services/notifications/notificationService'
import type {
  ReminderPreference,
  ReminderType,
} from '../types/notifications'

export function NotificationsPage() {
  const [
    preferences,
    setPreferences,
  ] = useState<ReminderPreference[]>(
    () => getReminderPreferences(),
  )

  const [
    masterEnabled,
    setMasterEnabled,
  ] = useState(() => notificationsEnabled())

  const [
    permission,
    setPermission,
  ] = useState(() =>
    getNotificationPermission(),
  )

  const [
    message,
    setMessage,
  ] = useState<string | null>(null)

  async function enableNotifications() {
    if (masterEnabled) {
      setNotificationsEnabled(false)
      setMasterEnabled(false)
      setMessage('Notificações desativadas. Suas preferências foram mantidas.')
      return
    }
    try {
      const result =
        await requestNotificationPermission()

      const enabled =
        result === 'granted'

      setNotificationsEnabled(enabled)
      setMasterEnabled(enabled)
      setPermission(result)

      setMessage(
        enabled
          ? 'Notificações ativadas neste aparelho.'
          : 'Permissão de notificação não concedida.',
      )
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível ativar notificações.',
      )
    }
  }

  function updatePreference(
    id: ReminderType,
    changes: Partial<ReminderPreference>,
  ) {
    setPreferences((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    )
  }

  function savePreferences() {
    saveReminderPreferences(preferences)
    setMessage('Preferências salvas.')
  }

  async function testNotification() {
    try {
      await showTitanNotification({
        title: 'TITAN',
        body: 'As notificações estão funcionando neste aparelho.',
        tag: 'titan-test',
        url: './',
      })

      setMessage(
        'Notificação de teste enviada.',
      )
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível testar a notificação.',
      )
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
          TITAN LEMBRETES
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Notificações
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Configure lembretes locais de acordo
          com sua rotina.
        </p>
      </header>

      <Card elevated>
        <div className="flex items-center gap-3">
          <BellRing
            className="text-amber-300"
            size={24}
            aria-hidden="true"
          />

          <div>
            <h2 className="font-bold">
              Permissão do aparelho
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Estado atual: {permission}
            </p>
          </div>
        </div>

        <Button
          className="mt-5"
          fullWidth
          onClick={enableNotifications}
        >
          <Bell
            size={18}
            aria-hidden="true"
          />

          {masterEnabled
            ? 'Desativar notificações'
            : 'Ativar notificações'}
        </Button>

        <Button
          className="mt-3"
          disabled={permission !== 'granted'}
          fullWidth
          onClick={testNotification}
          variant="ghost"
        >
          Testar notificação
        </Button>
      </Card>

      <Card>
        <p className="text-sm leading-6 text-slate-400">
          Lembretes dependem do navegador e do sistema. iOS exige instalação na tela inicial;
          navegadores podem suspender o app e não garantem agendamento em segundo plano sem um serviço de push.
        </p>
      </Card>

      <div className="space-y-3">
        {preferences.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold">
                  {item.label}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </div>

              <input
                checked={item.enabled}
                className="h-5 w-5 accent-blue-500"
                onChange={(event) =>
                  updatePreference(
                    item.id,
                    {
                      enabled:
                        event.target.checked,
                    },
                  )
                }
                type="checkbox"
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                Horário
              </span>

              <input
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none"
                onChange={(event) =>
                  updatePreference(
                    item.id,
                    {
                      time:
                        event.target.value,
                    },
                  )
                }
                type="time"
                value={item.time}
              />
            </label>
          </Card>
        ))}
      </div>

      <Button
        fullWidth
        onClick={savePreferences}
      >
        <Save
          size={18}
          aria-hidden="true"
        />

        Salvar lembretes
      </Button>

      {message ? (
        <p
          className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
